import { ActionType } from "../../../Constants/Enum";
import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";

/**
 * ActionEvent — base class ของทุก action ที่ตัวละครทำ
 * ใช้เช็ค "เมื่อมีการ action" ได้ด้วย instanceof ActionEvent
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
        duration: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority: number = 0
    ) {
        super(name, time, duration, priority);
        this.unit       = unit;
        this.actionType = actionType;
        this.isManual   = isManual;
    }
}
