import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { notifyEndAction } from "../../../Services/Combat/EndActionService";
import { notifyChangeToAuto } from "../../../Services/Combat/ChangeToAutoService";

/**
 * ActionEvent — base class ของทุก action ที่ตัวละครทำ
 * ใช้เช็ค "เมื่อมีการ action" ได้ด้วย instanceof ActionEvent
 *
 * execute เริ่มต้น (ใช้ร่วมกันทุก subclass): setBusy → onExecute?.() → auto-schedule
 * NotificationEvent(EndAction) ถ้ามีทั้ง duration และ timeline, และ auto-schedule
 * NotificationEvent(ChangeToAuto) ถ้ามีทั้ง autoStartFrame และ timeline — เปลี่ยนทีหลังได้เหมือนตัวแปรทั่วไป
 * (event.execute = () => {...}) ถ้า subclass ต้องการ logic อื่น
 *
 * constructor เป็น internal เท่านั้น — สร้าง instance จริงผ่าน static factory ของ subclass เท่านั้น:
 *   AttackActionEvent.manual(...) / AttackActionEvent.auto(...)
 *   BuffActionEvent.manual(...)   / BuffActionEvent.auto(...)
 * (เลิกใช้ parseActionTail แบบเดา runtime type แล้ว — เพราะ 0 ชนกับ duration:0 จริง เช่นของ Mornye's Ult)
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

    /** กินเวลากี่ frame ตั้งแต่เริ่มจนจบ action — "-" (undefined) = ไม่ระบุ/ไม่มี duration (ย้ายมาจาก CombatEvent เพราะมีแค่ ActionEvent/BuffStartEvent ที่ใช้จริง) */
    public readonly duration?: number;

    /** frame ที่เปลี่ยนเป็น auto นับจากเริ่ม action — ไม่ใส่ = action นี้ไม่มี auto transition */
    public readonly autoStartFrame?: number;

    constructor(
        name: string,
        time: number,
        priority: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean = true,
        duration?: number,
        autoStartFrame?: number,
        onExecute?: () => void,
        timeline?: TimelineRef
    ) {
        super(name, time, priority);
        this.unit           = unit;
        this.actionType     = actionType;
        this.isManual       = isManual;
        this.duration       = duration;
        this.autoStartFrame = autoStartFrame;

        this.execute = () => {
            this.unit.setBusy();
            onExecute?.();

            if (this.duration !== undefined && timeline) {
                notifyEndAction(timeline, this.duration);
            }

            if (this.autoStartFrame !== undefined && timeline) {
                notifyChangeToAuto(timeline, this.autoStartFrame);
            }
        };
    }
}
