import { AllyUnit } from "../../AllyUnit";
import { BuffEvent } from "./BuffEvent";

/**
 * BuffStartEvent — บัพเริ่มมีผลกับ target
 * execute ยังไม่ตั้งค่าเอง (ใช้ default no-op จาก CombatEvent) — ตั้งทีหลังได้ผ่าน instance.execute = () => {...}
 */
export class BuffStartEvent extends BuffEvent {
    /** บัพนี้มีผลนานกี่ frame — "-" (undefined) = ไม่ระบุ/ไม่มี duration */
    public readonly duration?: number;

    constructor(
        name: string,
        time: number,
        target: AllyUnit,
        duration?: number,
        priority: number = 0
    ) {
        super(name, time, target, priority);
        this.duration = duration;
    }
}
