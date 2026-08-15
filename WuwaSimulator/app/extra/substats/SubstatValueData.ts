import { StatsType } from "../../Constants/Enum";

// ─────────────────────────────────────────────────────────────
// ค่า stat จริงที่ได้ต่อ tier ต่อ substat — hard-code จาก wuwa_substat_table.xlsx
// (คู่กับ SUBSTAT_TABLES ใน SubstatData.ts ที่เก็บแค่ "โอกาส" ไม่เก็บ "ปริมาณ")
//
// ค่า %-based เก็บเป็น percentage point (เช่น 8.1 = 8.1%) ไม่ใช่ fraction (0.081)
// ให้ตรงกับหน่วยที่ AllyUnit.setStat()/getStats() ใช้จริง (ดู FLAT_STATS ใน
// DamageCalculate.ts — stat ที่ไม่ใช่ flat จะถูกหาร 100 ตอนคำนวณ)
//
// index 0 = tier 1 (เหมือน SUBSTAT_TABLES)
//
// StatsType.Dmg ใช้ตารางเดียวกันกับทั้ง 4 substat ในเกม (Basic/Heavy Attack DMG Bonus,
// Resonance Skill/Liberation DMG Bonus) เพราะค่าต่อ tier เท่ากันหมด — แยกว่าเป็น
// action type ไหนตอน apply จริงผ่าน EchoSubstats.actionType (ดู EchoSubstats.ts) ไม่ใช่ที่นี่
// ─────────────────────────────────────────────────────────────

export const SUBSTAT_VALUES: Partial<Record<StatsType, number[]>> = {
    [StatsType.FlatHp]:      [320, 360, 390, 430, 470, 510, 540, 580],
    [StatsType.DefP]:        [8.1, 9.0, 10.0, 10.9, 11.8, 12.8, 13.8, 14.7],
    [StatsType.AtkP]:        [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
    [StatsType.Hp]:          [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
    [StatsType.Dmg]:         [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
    [StatsType.EnergyRegen]: [6.8, 7.6, 8.4, 9.2, 10.0, 10.8, 11.6, 12.4],
    [StatsType.CR]:          [6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5],
    [StatsType.CD]:          [12.6, 13.8, 15.0, 16.2, 17.4, 18.6, 19.8, 21.0],
    [StatsType.FlatDef]:     [40, 50, 60, 70],
    [StatsType.FlatAtk]:     [30, 40, 50, 60],
};
