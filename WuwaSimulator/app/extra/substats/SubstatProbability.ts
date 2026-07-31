import { SUBSTAT_TABLES, SubstatTableKey } from "./SubstatData";

// ─────────────────────────────────────────────────────────────
// กลไก reroll/tune ของ substat (อ้างอิง README wuwa_substat_table.xlsx)
// - Reroll (recalibrate) = สุ่มใหม่ทั้ง 5 ช่อง — ไม่เกี่ยวกับไฟล์นี้
// - Tune = สุ่ม tier ใหม่ของ slot เดิม (ประเภทไม่เปลี่ยน) แล้วเก็บไว้เฉพาะถ้า tier สูงขึ้น
//   → โอกาส tune ขึ้น 1 ครั้งสำเร็จ = โอกาสสุ่มได้ tier "สูงกว่า tier ปัจจุบัน" = survival(tier+1)
// ─────────────────────────────────────────────────────────────

function getTable(tableKey: SubstatTableKey) {
    return SUBSTAT_TABLES[tableKey];
}

export function getMaxTier(tableKey: SubstatTableKey): number {
    return getTable(tableKey).exactChance.length;
}

export function getExactChance(tableKey: SubstatTableKey, tier: number): number {
    const { exactChance } = getTable(tableKey);
    if (tier < 1 || tier > exactChance.length) return 0;
    return exactChance[tier - 1];
}

// "Chance to roll at least this value" — SUM จาก tier ที่ระบุขึ้นไปจนสุด
export function getSurvivalChance(tableKey: SubstatTableKey, tier: number): number {
    const { exactChance } = getTable(tableKey);
    if (tier <= 1) return exactChance.reduce((sum, v) => sum + v, 0);
    if (tier > exactChance.length) return 0;
    return exactChance.slice(tier - 1).reduce((sum, v) => sum + v, 0);
}

// โอกาสที่การ tune 1 ครั้งจาก currentTier จะได้ tier สูงขึ้น (tier ปัจจุบัน max แล้ว = 0%)
export function getTuneUpChance(tableKey: SubstatTableKey, currentTier: number): number {
    const maxTier = getMaxTier(tableKey);
    if (currentTier >= maxTier) return 0;
    return getSurvivalChance(tableKey, currentTier + 1);
}

export interface TierRow {
    tier   : number;
    exact  : number;
    survive: number;
    tuneUp : number;
}

export function buildProbabilityTable(tableKey: SubstatTableKey): TierRow[] {
    const maxTier = getMaxTier(tableKey);
    const rows: TierRow[] = [];
    for (let tier = 1; tier <= maxTier; tier++) {
        rows.push({
            tier,
            exact  : getExactChance(tableKey, tier),
            survive: getSurvivalChance(tableKey, tier),
            tuneUp : getTuneUpChance(tableKey, tier),
        });
    }
    return rows;
}

export interface TuneTarget {
    tableKey: SubstatTableKey;
    tier    : number;
}

export interface TuneComparison {
    a        : TuneTarget & { chance: number };
    b        : TuneTarget & { chance: number };
    recommend: "a" | "b" | "either";
}

// เทียบว่าควร tune ตัวไหน (a หรือ b) โดยดูจากโอกาสสำเร็จล้วนๆ (ยังไม่ผูก value function ต่อตัวละคร —
// ดู README: ต้องมี value function ก่อนถึงจะจัดลำดับความสำคัญระหว่าง substat คนละประเภทได้แม่นกว่านี้)
export function compareTuneTarget(a: TuneTarget, b: TuneTarget): TuneComparison {
    const chanceA = getTuneUpChance(a.tableKey, a.tier);
    const chanceB = getTuneUpChance(b.tableKey, b.tier);

    let recommend: "a" | "b" | "either" = "either";
    if (chanceA > chanceB) recommend = "a";
    else if (chanceB > chanceA) recommend = "b";

    return {
        a: { ...a, chance: chanceA },
        b: { ...b, chance: chanceB },
        recommend,
    };
}

// ตาราง 2 มิติ: แถว = tier a (1..maxTierของ tableA), คอลัมน์ = tier b (1..maxTierของ tableB)
// ค่า 1 = ควรเลือกเพิ่ม tier a (chance a >= chance b), 0 = ควรเลือกเพิ่ม tier b
// เท่ากันพอดี (tie) นับเป็น 1 (เอนเอียงไปทาง a เป็นค่า default)
export function buildTuneDecisionMatrix(
    tableAKey: SubstatTableKey,
    tableBKey: SubstatTableKey = tableAKey
): number[][] {
    const maxA = getMaxTier(tableAKey);
    const maxB = getMaxTier(tableBKey);

    const matrix: number[][] = [];
    for (let a = 1; a <= maxA; a++) {
        const chanceA = getTuneUpChance(tableAKey, a);
        const row: number[] = [];
        for (let b = 1; b <= maxB; b++) {
            const chanceB = getTuneUpChance(tableBKey, b);
            row.push(chanceA >= chanceB ? 1 : 0);
        }
        matrix.push(row);
    }
    return matrix;
}
