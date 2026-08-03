import { ActionType } from "../../../Constants/Enum";
import { AllyUnit, TimelineRef } from "../../AllyUnit";
import { ActionEvent } from "./ActionEvent";

/**
 * BuffActionEvent — action buff skill
 * ใช้เช็ค "เมื่อมีการ action buff" ด้วย instanceof BuffActionEvent
 *
 * สร้างผ่าน static factory เท่านั้น (constructor เป็น private) — signature/logic เหมือน AttackActionEvent ทุกอย่าง:
 *   .manual(...) — isManual:true, ต้องมี duration หรือ autoStartFrame อย่างน้อย 1 อย่าง (throw ถ้าไม่มีเลย)
 *   .auto(...)   — isManual:false, ไม่รับ duration/autoStartFrame
 */
export class BuffActionEvent extends ActionEvent {
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
    ): BuffActionEvent {
        if (duration === undefined && autoStartFrame === undefined) {
            throw new Error(
                `BuffActionEvent.manual("${name}"): ต้องมี duration หรือ autoStartFrame อย่างน้อย 1 อย่าง ไม่งั้น isGlobalLocked จะค้าง true ตลอดไป`
            );
        }
        return new BuffActionEvent(name, time, priority, unit, actionType, true, duration, autoStartFrame, onExecute, timeline);
    }

    static auto(
        name: string,
        time: number,
        priority: number,
        unit: AllyUnit,
        actionType: ActionType,
        onExecute?: () => void,
        timeline?: TimelineRef
    ): BuffActionEvent {
        return new BuffActionEvent(name, time, priority, unit, actionType, false, undefined, undefined, onExecute, timeline);
    }
}
