import { ActionType } from "../../../Constants/Enum";
import { AllyUnit } from "../../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * BuffActionEvent — action buff skill
 * ใช้เช็ค "เมื่อมีการ action buff" ด้วย instanceof BuffActionEvent
 */
export class BuffActionEvent extends ActionEvent {
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
