import { CombatEvent } from "./CombatEvent";
import { AllyUnit } from "../../AllyUnit";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * ChangeToAuto — action transition จาก manual เป็น auto กลางท่า
 * ปล่อยแค่ GlobalLock (unit ยัง Busy อยู่ต่อ) — CombatTimeline.tick() เช็คด้วย instanceof แล้วปลด lock ให้เอง
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — unit เลื่อนตามหลังเสมอ
 */
export class ChangeToAuto extends CombatEvent {
    /** unit ที่เกี่ยวข้อง (ถ้ามี) */
    public readonly unit: AllyUnit | null;

    constructor(name: string, unit?: AllyUnit | null);
    constructor(name: string, time: number, unit?: AllyUnit | null);
    constructor(name: string, time: number, priority: number, unit?: AllyUnit | null);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit] = rest as [AllyUnit | null | undefined];

        super(name, time, priority);
        this.unit = unit ?? null;
    }
}
