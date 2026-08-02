import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { notifyEndAction } from "../../../Services/Combat/EndActionService";

/**
 * ActionEvent — base class ของทุก action ที่ตัวละครทำ
 * ใช้เช็ค "เมื่อมีการ action" ได้ด้วย instanceof ActionEvent
 *
 * execute เริ่มต้น (ใช้ร่วมกันทุก subclass): setBusy → onExecute?.() → auto-schedule
 * NotificationEvent(EndAction) ถ้ามีทั้ง duration และ timeline — เปลี่ยนทีหลังได้เหมือนตัวแปรทั่วไป
 * (event.execute = () => {...}) ถ้า subclass ต้องการ logic อื่น
 *
 * subclass:
 *   AttackActionEvent — action โจมตี
 *   BuffActionEvent   — action buff skill
 */
export abstract class ActionEvent extends CombatEvent {
    /** unit ที่ทำ action นี้ */
    public readonly unit: AllyUnit;

    /** ประเภทของ action */
    public readonly actionType: ActionType;

    /**
     * action นี้เริ่มต้นเป็น manual หรือไม่
     * true  → GlobalLock ON เมื่อ execute
     * false → UnitLock เท่านั้น
     */
    public readonly isManual: boolean;

    constructor(
        name: string,
        time: number,
        duration: number | undefined,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority: number = 0,
        onExecute?: () => void,
        timeline?: TimelineRef
    ) {
        super(name, time, duration, priority);
        this.unit       = unit;
        this.actionType = actionType;
        this.isManual   = isManual;

        this.execute = () => {
            this.unit.setBusy();
            onExecute?.();

            if (this.duration !== undefined && timeline) {
                notifyEndAction(timeline, this.duration);
            }
        };
    }
}
