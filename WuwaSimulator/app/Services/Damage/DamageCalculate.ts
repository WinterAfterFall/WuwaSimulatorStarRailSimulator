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
    defShred: number;
    respen  : number;
}

interface TargetStats {
    def     : number;
    dmgBonus: number;
    dmgRed  : number;
    elemRed : number;
}

// stats ที่ต้องรวม dimension ของ element เข้าไปด้วย
const ELEMENT_DIMENSION_STATS = new Set<StatsType>([
    StatsType.Dmg,
    StatsType.Amp,
    StatsType.Respen,
    StatsType.ElemRed,
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

    // Element dimension (Dmg, Amp, Respen, ElemRed เท่านั้น)
    if (ELEMENT_DIMENSION_STATS.has(st) && element !== ElementType.None) {
        total += unit.getStats(st, element, ActionType.None);
        for (const at of attackTypeList) {
            total += unit.getStats(st, element, at);
        }
    }

    return total;
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
        defShred: sumStat(attacker, StatsType.DefShred, damage),
        respen  : sumStat(attacker, StatsType.Respen,   damage),
    };
}

// ─────────────────────────────────────────────────────────────
// computeTargetStats
// ─────────────────────────────────────────────────────────────

function computeTargetStats(target: EnemyUnit, damage: Damage): TargetStats {
    const defRed  = sumStat(target, StatsType.DefRed,  damage);
    const flatDef = sumStat(target, StatsType.FlatDef, damage);

    // baseDef คำนวณจาก level, DefRed เป็น debuff บน enemy — ลด DEF ก่อนเข้าสูตร %DEF
    const baseDef = 8 * target.level + 792;
    const def     = baseDef * Math.max(0, 1 - defRed) + flatDef;

    return {
        def,
        dmgBonus: sumStat(target, StatsType.Dmg,    damage),
        dmgRed  : sumStat(target, StatsType.DmgRed, damage),
        elemRed : target.baseElemRed + sumStat(target, StatsType.ElemRed, damage),
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

    // Amplify
    const ampMulti = 1 + attackerStats.amp;

    // %DEF = (800 + 8×LVL) / (800 + 8×LVL + DEF_Target × (1 − DEF Ignore))
    const lvlFactor  = 800 + 8 * attackerStats.level;
    const defMulti   = lvlFactor / (lvlFactor + targetStats.def * Math.max(0, 1 - attackerStats.defShred));

    // RES_total = elemRed − resPen (ติดลบได้)
    const resTotal = targetStats.elemRed - attackerStats.respen;
    const resMulti = resTotal < 0   ? 1 - resTotal / 2
                   : resTotal < 0.8 ? 1 - resTotal
                   :                  1 / (1 + 5 * resTotal);

    // Damage Reduction ฝั่ง target
    const reductionMulti = Math.max(0, 1 - targetStats.dmgRed);

    return base * dmgBonusMulti * critMulti * ampMulti * defMulti * resMulti * reductionMulti;
}

// ─────────────────────────────────────────────────────────────
// calculateDamage (public API)
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
