import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * AttackActionEvent — action โจมตี
 * ใช้เช็ค "เมื่อมีการ action โจมตี" ด้วย instanceof AttackActionEvent
 *
 * duration เป็น "-" (ไม่ใส่) ได้ — ถ้าไม่ใส่ execute() จะไม่ auto-schedule NotificationEvent(EndAction) ให้
 * ถ้าใส่ duration + timeline มาด้วย execute() จะ schedule NotificationEvent(EndAction) ที่ time+duration ให้เอง
 * (logic นี้อยู่ใน ActionEvent constructor — ใช้ร่วมกับ BuffActionEvent)
 */
export class AttackActionEvent extends ActionEvent {
    // แบบไม่ใส่ duration ("-")
    constructor(
        name: string,
        time: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority?: number,
        onExecute?: () => void,
        timeline?: TimelineRef
    );
    // แบบใส่ duration ครบ
    constructor(
        name: string,
        time: number,
        duration: number,
        unit: AllyUnit,
        actionType: ActionType,
        isManual: boolean,
        priority?: number,
        onExecute?: () => void,
        timeline?: TimelineRef
    );
    constructor(
        name: string,
        time: number,
        arg3: number | AllyUnit,
        arg4?: AllyUnit | ActionType,
        arg5?: ActionType | boolean,
        arg6?: boolean | number,
        arg7?: number | (() => void),
        arg8?: (() => void) | TimelineRef,
        arg9?: TimelineRef
    ) {
        let duration  : number | undefined;
        let unit      : AllyUnit;
        let actionType: ActionType;
        let isManual  : boolean;
        let priority  : number;
        let onExecute : (() => void) | undefined;
        let timeline  : TimelineRef | undefined;

        if (typeof arg3 === "number") {
            duration   = arg3;
            unit       = arg4 as AllyUnit;
            actionType = arg5 as ActionType;
            isManual   = arg6 as boolean;
            priority   = (arg7 as number) ?? 0;
            onExecute  = arg8 as (() => void) | undefined;
            timeline   = arg9;
        } else {
            duration   = undefined;
            unit       = arg3;
            actionType = arg4 as ActionType;
            isManual   = arg5 as boolean;
            priority   = (arg6 as number) ?? 0;
            onExecute  = arg7 as (() => void) | undefined;
            timeline   = arg8 as TimelineRef | undefined;
        }

        super(name, time, duration, unit, actionType, isManual, priority, onExecute, timeline);
    }
}
