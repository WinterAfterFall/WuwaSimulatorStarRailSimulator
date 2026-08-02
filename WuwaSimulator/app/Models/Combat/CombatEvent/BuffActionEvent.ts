import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * BuffActionEvent — action buff skill
 * ใช้เช็ค "เมื่อมีการ action buff" ด้วย instanceof BuffActionEvent
 *
 * ถ้าใส่ timeline มาด้วย execute() จะ auto-schedule NotificationEvent(EndAction) ที่ time+duration
 * ให้เอง (logic อยู่ใน ActionEvent constructor — ใช้ร่วมกับ AttackActionEvent)
 */
export class BuffActionEvent extends ActionEvent {
    constructor(
        name: string,
        time: number,
        duration: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority: number = 0,
        onExecute?: () => void,
        timeline?: TimelineRef
    ) {
        super(name, time, duration, unit, actionType, isManual, priority, onExecute, timeline);
    }
}
