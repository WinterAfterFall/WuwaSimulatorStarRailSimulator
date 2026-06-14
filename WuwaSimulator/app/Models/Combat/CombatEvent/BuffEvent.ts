import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";

/**
 * BuffEvent — base class ของ event ที่เกี่ยวกับบัพ/ดีบัพ
 * ใช้เช็ค "เมื่อมีบัพเริ่ม/จบ" ได้ด้วย instanceof BuffEvent
 *
 * subclass:
 *   BuffStartEvent — บัพเริ่มมีผล
 *   BuffEndEvent   — บัพหมดผล
 */
export abstract class BuffEvent extends CombatEvent {
    public readonly target: AllyUnit;

    constructor(
        name: string,
        time: number,
        duration: number,
        target: AllyUnit,
        priority: number = 0
    ) {
        super(name, time, duration, priority);
        this.target = target;
    }
}
