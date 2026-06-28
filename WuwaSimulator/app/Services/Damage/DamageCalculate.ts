import { Damage } from "../../Models/Combat/Damage";
import { AllyUnit } from "../../Models/AllyUnit";
import { EnemyUnit } from "../../Models/EnemyUnit";
import { Unit } from "../../Models/Unit";
import { StatsType, ActionType, ElementType } from "../../Constants/Enum";
import { MultiplierType } from "../../Constants/Enum";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AttackerStats {
    level   : number;
    atk     : number;
    hp      : number;
    def     : number;
    cr      : number;
    cd      : number;
    dmgBonus: number;
    amp     : number;
    sp      : number;
    defShred: number;
    respen  : number;
}

interface TargetStats {
    def     : number;
    dmgBonus: number;
    dmgRed  : number;
    amp     : number;
    resred  : number;   // natural elemental resistance → piecewise RES Multiplier
    elemRed : number;   // Elemental Reduction → multiplier แยก (1 − elemRed)
}

// stats ที่ต้องรวม dimension ของ element เข้าไปด้วย
// ResRed (natural resistance) เป็น element-specific → อยู่ใน set
// ElemRed (Elemental Reduction) เป็น global multiplier → ไม่ต้องการ element dimension
const ELEMENT_DIMENSION_STATS = new Set<StatsType>([
    StatsType.Dmg,
    StatsType.Amp,
    StatsType.ResPen,
    StatsType.ResRed,
]);

// stats ที่เป็นค่า flat (ไม่ต้องหาร 100) — ที่เหลือทั้งหมดเป็น % → หาร 100 อัตโนมัติ
const FLAT_STATS = new Set<StatsType>([
    StatsType.FlatAtk,
    StatsType.FlatHp,
    StatsType.FlatDef,
]);

// ─────────────────────────────────────────────────────────────
// sumStat — รวม stat จากทุก dimension ที่เกี่ยวข้อง
// ─────────────────────────────────────────────────────────────

function sumStat(unit: Unit, st: StatsType, damage: Damage): number {
    const { attackTypeList, element } = damage;

    // Base + per-action
    let total = unit.getStats(st);
    for (const at of attackTypeList) {
        total += unit.getStats(st, at);
    }

    // Element dimension (Dmg, Amp, ResPen, ResRed เท่านั้น)
    if (ELEMENT_DIMENSION_STATS.has(st) && element !== ElementType.None) {
        total += unit.getStats(st, element, ActionType.None);
        for (const at of attackTypeList) {
            total += unit.getStats(st, element, at);
        }
    }

    return FLAT_STATS.has(st) ? total : total / 100;
}

// ─────────────────────────────────────────────────────────────
// computeAttackerStats
// ─────────────────────────────────────────────────────────────

function computeAttackerStats(attacker: AllyUnit, damage: Damage): AttackerStats {
    const atkP    = sumStat(attacker, StatsType.AtkP,   damage);
    const flatAtk = sumStat(attacker, StatsType.FlatAtk, damage);
    const hpP     = sumStat(attacker, StatsType.Hp,     damage);
    const flatHp  = sumStat(attacker, StatsType.FlatHp, damage);
    const defP    = sumStat(attacker, StatsType.DefP,   damage);
    const flatDef = sumStat(attacker, StatsType.FlatDef, damage);

    return {
        level   : attacker.level,
        atk     : attacker.baseAtk * (1 + atkP)  + flatAtk,
        hp      : attacker.baseHp  * (1 + hpP)   + flatHp,
        def     : attacker.baseDef * (1 + defP)  + flatDef,
        cr      : Math.min(sumStat(attacker, StatsType.CR,       damage), 1),
        cd      : sumStat(attacker, StatsType.CD,       damage),
        dmgBonus: sumStat(attacker, StatsType.Dmg,      damage),
        amp     : sumStat(attacker, StatsType.Amp,      damage),
        sp      : sumStat(attacker, StatsType.Sp,       damage),
        defShred: sumStat(attacker, StatsType.DefShred, damage),
        respen  : sumStat(attacker, StatsType.ResPen,  damage),
    };
}

// ─────────────────────────────────────────────────────────────
// computeTargetStats
// ─────────────────────────────────────────────────────────────

function computeTargetStats(target: EnemyUnit, damage: Damage): TargetStats {
    const defRed  = sumStat(target, StatsType.DefRed,  damage);
    
    // baseDef คำนวณจาก level, DefRed เป็น debuff บน enemy — ลด DEF ก่อนเข้าสูตร %DEF
    const baseDef = 8 * target.level + 792;
    const def     = baseDef * Math.max(0, 1 - defRed);

    return {
        def,
        dmgBonus: sumStat(target, StatsType.Dmg,    damage),
        dmgRed  : sumStat(target, StatsType.DmgRed, damage),
        amp     : sumStat(target, StatsType.Amp,    damage),
        resred  : sumStat(target, StatsType.ResRed,  damage),
        elemRed : sumStat(target, StatsType.ElemRed, damage),
    };
}

// ─────────────────────────────────────────────────────────────
// applyDamageFormula
// ─────────────────────────────────────────────────────────────

function applyDamageFormula(
    damage       : Damage,
    attackerStats: AttackerStats,
    targetStats  : TargetStats
): number {
    const m = damage.multipliers;

    // Base damage จาก multipliers ของ skill
    const base = attackerStats.atk * m[MultiplierType.Atk]
               + attackerStats.hp  * m[MultiplierType.Hp]
               + attackerStats.def * m[MultiplierType.Def]
               + m[MultiplierType.Const];

    // DMG Bonus
    const dmgBonusMulti = 1 + attackerStats.dmgBonus;

    // Crit (expected value: 1 + CR × CD)
    const critMulti = damage.isCritable
        ? 1 + attackerStats.cr * attackerStats.cd
        : 1;

    // Amplify — รวม attacker + enemy (Σ additive)
    const ampMulti = 1 + attackerStats.amp + targetStats.amp;

    // Special DMG — independent multiplier (wiki: %Special = 1 + Special)
    const spMulti = 1 + attackerStats.sp;

    // %DEF = (800+8×LVL) / (800+8×LVL + DEF×(1−DefIgnore)), cap ที่ 200%
    // เมื่อ denominator ≤ 0 (DefIgnore มากเกินไป) → cap ที่ 200% ตาม wiki
    const lvlFactor  = 800 + 8 * attackerStats.level;
    const defDenom   = lvlFactor + targetStats.def * (1 - attackerStats.defShred);
    const defMulti   = defDenom <= 0 ? 2 : Math.min(2, lvlFactor / defDenom);

    // ResRed บน enemy เก็บเป็น (debuffs − natural_res) → negate เพื่อให้ได้ (natural_res − debuffs − ResPen)
    const resTotal = -targetStats.resred - attackerStats.respen;
    const resMulti = resTotal < 0   ? 1 - resTotal / 2
                   : resTotal < 0.8 ? 1 - resTotal
                   :                  1 / (1 + 5 * resTotal);

    // Elemental Reduction — multiplier แยกจาก RES (wiki: Elem Reduction_Total = 1 − ElemRed)
    const elemRedMulti = Math.max(0, 1 - targetStats.elemRed);

    // Damage Reduction ฝั่ง target
    const reductionMulti = Math.max(0, 1 - targetStats.dmgRed);

    return base * dmgBonusMulti * critMulti * ampMulti * spMulti * defMulti * resMulti * elemRedMulti * reductionMulti;
}

// ─────────────────────────────────────────────────────────────
// calculateDamage (public API)ไ
// ─────────────────────────────────────────────────────────────

export function calculateDamage(damage: Damage): void {
    const attacker      = damage.attacker;
    const attackerStats = computeAttackerStats(attacker, damage);

    for (const target of damage.targets) {
        const targetStats = computeTargetStats(target, damage);
        const result      = applyDamageFormula(damage, attackerStats, targetStats);

        console.log(`[Damage] ${attacker.name} ตี ${target.name}: ${result.toFixed(2)}`);
    }
}
