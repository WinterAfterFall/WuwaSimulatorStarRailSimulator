import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * BuffEvent — base class ของ event ที่เกี่ยวกับบัพ/ดีบัพ
 * ใช้เช็ค "เมื่อมีบัพเริ่ม/จบ" ได้ด้วย instanceof BuffEvent
 *
 * subclass:
 *   BuffStartEvent — บัพเริ่มมีผล
 *   BuffEndEvent   — บัพหมดผล
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — target เลื่อนตามหลังเสมอ
 */
export abstract class BuffEvent extends CombatEvent {
    public readonly target: AllyUnit;

    constructor(name: string, target: AllyUnit);
    constructor(name: string, time: number, target: AllyUnit);
    constructor(name: string, time: number, priority: number, target: AllyUnit);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [target] = rest as [AllyUnit];

        super(name, time, priority);
        this.target = target;
    }
}
