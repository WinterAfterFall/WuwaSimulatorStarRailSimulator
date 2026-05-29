import { CombatTimeline } from "./CombatTimeline";
import { CombatEvent } from "../Models/Combat/CombatEvent";
import { AllyUnit } from "../Models/AllyUnit";
import { ActionType } from "../Constants/Enum";

/**
 * RotationBuilder — ตัวช่วย pre-define rotation ของแต่ละ unit
 * สร้าง CombatEvent แล้วยัดลง CombatTimeline ผ่าน method chaining
 *
 * การใช้งาน:
 *   builder
 *     .add(rover, ActionType.BA,    0.00)
 *     .add(rover, ActionType.Skill, 1.50)
 *     .add(jiyan, ActionType.Intro, 3.00)
 */
export class RotationBuilder {
    private timeline: CombatTimeline;

    /** ใช้นับ event เพื่อสร้าง id ที่ไม่ซ้ำกัน */
    private eventCounter: number = 0;

    constructor(timeline: CombatTimeline) {
        this.timeline = timeline;
    }

    /**
     * เพิ่ม action ของ unit เข้า timeline ณ เวลาที่กำหนด
     * @param unit     unit ที่จะทำ action
     * @param action   ประเภทของ action
     * @param time     เวลาที่ action จะเกิดขึ้น (วินาที)
     * @param callback โค้ดที่รันเมื่อถึงเวลา — ถ้าไม่ส่งจะ log ให้อัตโนมัติ
     * @returns this   เพื่อรองรับ method chaining
     */
    public add(unit: AllyUnit, action: ActionType, time: number, callback?: () => void): this {
        const id = `${unit.name}-${action}-${this.eventCounter++}`;

        const execute = callback ?? (() => {
            console.log(`[t=${time.toFixed(2)}s] ${unit.name} → ${action}`);
        });

        this.timeline.schedule(new CombatEvent(id, time, execute));
        return this;
    }

    /** จำนวน event ที่ queue ไว้ใน timeline ทั้งหมด */
    public get size(): number {
        return this.timeline.size;
    }
}
