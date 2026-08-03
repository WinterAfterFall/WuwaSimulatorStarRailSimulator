import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * AttackActionEvent — action โจมตี
 * ใช้เช็ค "เมื่อมีการ action โจมตี" ด้วย instanceof AttackActionEvent
 *
 * สร้างผ่าน static factory เท่านั้น (constructor เป็น private):
 *   .manual(...) — isManual:true, ต้องมี duration หรือ autoStartFrame อย่างน้อย 1 อย่าง (throw ถ้าไม่มีเลย
 *                  เพราะ isGlobalLocked จะไม่มีทางถูกปลดล็อกอัตโนมัติ)
 *   .auto(...)   — isManual:false, ไม่ล็อก GlobalLock เลยจึงไม่รับ duration/autoStartFrame
 *
 * ถ้าใส่ duration + timeline มาด้วย execute() จะ schedule NotificationEvent(EndAction) ที่ time+duration ให้เอง
 * ถ้าใส่ autoStartFrame + timeline มาด้วย execute() จะ schedule NotificationEvent(ChangeToAuto) ให้เองเช่นกัน
 * (logic ทั้งคู่อยู่ใน ActionEvent constructor — ใช้ร่วมกับ BuffActionEvent)
 */
export class AttackActionEvent extends ActionEvent {
    private constructor(
        name: string,
        time: number,
        priority: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        duration?: number,
        autoStartFrame?: number,
        onExecute?: () => void,
        timeline?: TimelineRef
    ) {
        super(name, time, priority, unit, actionType, isManual, duration, autoStartFrame, onExecute, timeline);
    }

    static manual(
        name: string,
        time: number,
        priority: number,
        unit: AllyUnit,
        actionType: ActionType,
        duration?: number,
        autoStartFrame?: number,
        onExecute?: () => void,
        timeline?: TimelineRef
    ): AttackActionEvent {
        if (duration === undefined && autoStartFrame === undefined) {
            throw new Error(
                `AttackActionEvent.manual("${name}"): ต้องมี duration หรือ autoStartFrame อย่างน้อย 1 อย่าง ไม่งั้น isGlobalLocked จะค้าง true ตลอดไป`
            );
        }
        return new AttackActionEvent(name, time, priority, unit, actionType, true, duration, autoStartFrame, onExecute, timeline);
    }

    static auto(
        name: string,
        time: number,
        priority: number,
        unit: AllyUnit,
        actionType: ActionType,
        onExecute?: () => void,
        timeline?: TimelineRef
    ): AttackActionEvent {
        return new AttackActionEvent(name, time, priority, unit, actionType, false, undefined, undefined, onExecute, timeline);
    }
}
