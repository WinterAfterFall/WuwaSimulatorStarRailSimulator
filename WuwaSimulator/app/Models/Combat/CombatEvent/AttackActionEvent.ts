import { ActionEvent } from "./ActionEvent";
import { AllyUnit } from "../../AllyUnit";
import { ActionType, TriggerEvent } from "../../../Constants/Enum";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * AttackActionEvent — action โจมตี
 * ใช้เช็ค "เมื่อมีการ action โจมตี" ด้วย instanceof AttackActionEvent
 *
 * รับ 3 overload เดียวกับ ActionEvent ทุกอย่าง (name / name+time / name+time+priority ก่อน
 * unit, actionType, isManual?) ส่ง duration/changeToAutoTime เข้า battleField.scheduleStartOnFieldAction()
 * ตอน schedule แทน — ต่างจาก ActionEvent เดิมตรงที่ห่อ execute เพิ่มอีกชั้นเพื่อ emit
 * TriggerEvent.AttackAction ให้ passive ตัวอื่นรู้ว่า "มีการโจมตีเกิดขึ้น" ทุกครั้งที่ execute
 */
export class AttackActionEvent extends ActionEvent {
    constructor(name: string, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, time: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, time: number, priority: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit, actionType, isManual] = rest as [AllyUnit, ActionType, boolean?];

        super(name, time, priority, unit, actionType, isManual);

        const base = this.execute;
        this.setExecute((battleField) => {
            base(battleField);
            battleField.triggerBus.emit(TriggerEvent.AttackAction, { unit: this.unit, actionType: this.actionType });
        });
    }
}
