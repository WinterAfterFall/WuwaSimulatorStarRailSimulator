import { ActionType } from "../Constants/Enum";
import { AllyUnit } from "../Models/AllyUnit";
import { AttackActionEvent } from "../Models/Combat/AttackActionEvent";
import { CombatTimeline } from "./CombatTimeline";

/**
 * RotationBuilder — pre-define rotation ของแต่ละ unit
 * ทุก action ที่ add เข้ามาเป็น Manual เสมอ
 *
 * ก่อน push จะเช็ค:
 *   1. isGlobalLocked → ถ้า lock อยู่ข้าม (manual action อื่นกำลังทำงาน)
 *   2. unit.isFree()  → ถ้า unit ยัง busy ข้าม
 */
export class RotationBuilder {
    private timeline: CombatTimeline;
    private eventCounter: number = 0;

    constructor(timeline: CombatTimeline) {
        this.timeline = timeline;
    }

    /**
     * เพิ่ม manual action เข้า timeline
     * @param unit      unit ที่จะทำ action
     * @param action    ประเภทของ action
     * @param frame     frame ที่ action จะเกิดขึ้น (1 วิ = 60 frame)
     * @param duration  action กินเวลากี่ frame
     * @param priority  tie-breaker เมื่อ frame เท่ากัน (น้อย = ออกก่อน)
     */
    public add(
        unit: AllyUnit,
        action: ActionType,
        frame: number,
        duration: number,
        priority: number = 0
    ): this {
        // GlobalLock ON → manual action อื่นกำลังทำอยู่ → ข้าม
        if (this.timeline.isGlobalLocked) return this;

        // unit ยัง busy → ข้าม
        if (!unit.isFree()) return this;

        const id = `${unit.name}-${action}-${this.eventCounter++}`;
        this.timeline.schedule(new AttackActionEvent(id, frame, duration, unit, action, true, priority));
        return this;
    }

    public get size(): number {
        return this.timeline.size;
    }
}
