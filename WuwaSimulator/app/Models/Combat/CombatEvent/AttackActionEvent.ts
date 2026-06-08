import { ActionType } from "../../Constants/Enum";
import { AllyUnit } from "../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * AttackActionEvent — action โจมตี
 * ใช้เช็ค "เมื่อมีการ action โจมตี" ด้วย instanceof AttackActionEvent
 */
export class AttackActionEvent extends ActionEvent {
    constructor(
        name: string,
        time: number,
        duration: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority: number = 0
    ) {
        super(name, time, duration, unit, actionType, isManual, priority);
    }

    public execute(): void {
        this.unit.setBusy();
        this.unit.execute(this.actionType);
    }
}
