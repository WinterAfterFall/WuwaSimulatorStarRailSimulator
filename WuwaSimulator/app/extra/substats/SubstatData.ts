// ─────────────────────────────────────────────────────────────
// ข้อมูลความน่าจะเป็นของ substat tier — hard-code จาก wuwa_substat_table.xlsx
// (ไฟล์ excel ต้นฉบับถูกลบไปแล้ว ข้อมูลนี้คือ source of truth ที่เหลืออยู่ —
//  ตอนนี้มีไฟล์ที่สร้างขึ้นใหม่แทนที่แล้วที่ app/extra/substats/wuwa_substat_table.xlsx)
//
// substat ทุกตัวถูกแบ่งเป็น 4 กลุ่มความน่าจะเป็น (tableKey) — substat ในกลุ่ม
// เดียวกันแชร์ exactChance ต่อ tier ชุดเดียวกัน (ไม่เก็บปริมาณ stat จริงต่อ tier — เก็บแค่โอกาส)
//
// exactChance เก็บเฉพาะโอกาสได้ตรง tier นั้น — แถว "Chance to roll (at least)" ในไฟล์ excel
// (โอกาสสะสมของการได้ tier นี้ขึ้นไป) ไม่ได้เก็บแยกไว้ที่นี่ แต่คำนวณจาก exactChance ชุดนี้ผ่าน
// getSurvivalChance() ใน SubstatProbability.ts (sum จาก tier ที่ระบุขึ้นไปจนสุด)
// ─────────────────────────────────────────────────────────────

import { StatsType } from "../../Constants/Enum";

export type SubstatTableKey = "main" | "crit" | "flatAtk" | "flatDef";

export interface SubstatTable {
    key        : SubstatTableKey;
    label      : string;
    exactChance: number[]; // % โอกาสได้ตรง tier นั้น, index 0 = tier 1
}

export const SUBSTAT_TABLES: Record<SubstatTableKey, SubstatTable> = {
    main: {
        key        : "main",
        label      : "Main (HP / DEF% / ATK% / HP% / DMG Bonus ต่างๆ / Energy Regen)",
        exactChance: [6.7961, 7.7670, 20.3883, 24.2718, 17.4757, 14.5631, 5.8252, 2.9126],
    },
    crit: {
        key        : "crit",
        label      : "Crit Rate / Crit DMG",
        exactChance: [23.3333, 23.3333, 23.3333, 8.0000, 8.0000, 8.0000, 3.0000, 3.0000],
    },
    flatAtk: {
        key        : "flatAtk",
        label      : "ATK (flat)",
        exactChance: [6.7961, 52.4272, 37.8641, 2.9126],
    },
    flatDef: {
        key        : "flatDef",
        label      : "DEF (flat)",
        exactChance: [14.5631, 44.6602, 32.0388, 8.7379],
    },
};

// StatsType ไหนใช้ตาราง probability ไหน — คู่กับ key ของ SUBSTAT_VALUES ใน SubstatValueData.ts
const STAT_TABLE_KEY: Partial<Record<StatsType, SubstatTableKey>> = {
    [StatsType.FlatHp]:      "main",
    [StatsType.DefP]:        "main",
    [StatsType.AtkP]:        "main",
    [StatsType.Hp]:          "main",
    [StatsType.Dmg]:         "main",
    [StatsType.EnergyRegen]: "main",
    [StatsType.CR]:          "crit",
    [StatsType.CD]:          "crit",
    [StatsType.FlatAtk]:     "flatAtk",
    [StatsType.FlatDef]:     "flatDef",
};

export function getTableKeyForStat(type: StatsType): SubstatTableKey {
    const key = STAT_TABLE_KEY[type];
    if (!key) throw new Error(`getTableKeyForStat: "${type}" ไม่ใช่ substat type ที่มีตาราง probability`);
    return key;
}
