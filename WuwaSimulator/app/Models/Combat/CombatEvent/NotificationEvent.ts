import { NotificationType } from "../../Constants/Enum";
import { AllyUnit } from "../AllyUnit";
import { CombatEvent } from "./CombatEvent";

/**
 * NotificationEvent — event แจ้งเหตุการณ์ทั่วไปใน timeline
 * ครอบคลุม: ChangeToAuto, EndAction, BuffExpired, DebuffExpired
 *
 * ใช้ notifyType เพื่อแยก logic ภายใน execute()
 */
export class NotificationEvent extends CombatEvent {
    public readonly notifyType: NotificationType;

    /** unit ที่เกี่ยวข้องกับ notification นี้ (ถ้ามี) */
    public readonly unit: AllyUnit | null;

    constructor(
        name: string,
        time: number,
        notifyType: NotificationType,
        unit: AllyUnit | null = null,
        priority: number = 0
    ) {
        super(name, time, 0, priority);
        this.notifyType = notifyType;
        this.unit       = unit;
    }

    public execute(): void {
        // logic จะถูกกำหนดโดย CombatTimeline ตอน tick
        // NotificationEvent เป็นแค่ signal — ไม่รัน logic เอง
    }
}
