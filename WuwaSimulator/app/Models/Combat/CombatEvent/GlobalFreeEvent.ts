import { CombatEvent } from "./CombatEvent";
import { AllyUnit } from "../../AllyUnit";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * GlobalFreeEvent — ปลด GlobalLock อย่างเดียว **ไม่แตะ unit lock**
 *
 * ใช้กับท่าที่เปลี่ยนเป็น auto กลางคัน: ผู้เล่นสั่ง action ตัวถัดไปได้แล้ว
 * แต่ตัวละครยังติดแอนิเมชันของท่าเดิมอยู่ (`actionState` ยังเป็น `Busy`)
 *
 * ต่างจาก `ActionFreeEvent.onField` ที่ปลดทั้งสองอย่างพร้อมกัน — ตัวนั้นใช้ตอนท่าจบจริง
 *
 * (เดิมชื่อ `ChangeToAuto` และให้ `BattleField.tick()` เช็ค `instanceof` แล้วปลดล็อกให้
 * ตอนนี้ย้ายมาอยู่ใน `execute` ของตัวเอง — `tick()` จึงไม่ต้องรู้จัก event ชนิดนี้อีกต่อไป
 * แบบเดียวกับ `ActionFreeEvent` / `SwapCharacterEvent`)
 */
export class GlobalFreeEvent extends CombatEvent {
    /** unit ที่ยังติดแอนิเมชันอยู่ตอนล็อกถูกปลด */
    public readonly unit: AllyUnit;

    constructor(name: string, unit: AllyUnit);
    constructor(name: string, time: number, unit: AllyUnit);
    constructor(name: string, time: number, priority: number, unit: AllyUnit);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit] = rest as [AllyUnit];

        super(name, time, priority);
        this.unit = unit;

        this.execute = (battleField) => {
            battleField.isGlobalLocked = false;
        };
    }
}
