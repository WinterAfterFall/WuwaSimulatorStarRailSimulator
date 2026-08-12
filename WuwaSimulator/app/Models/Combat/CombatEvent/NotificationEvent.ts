import { NotificationType } from "../../../Constants/Enum";
import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * NotificationEvent — event แจ้งเหตุการณ์ทั่วไปใน timeline
 * ครอบคลุม: ChangeToAuto, EndAction, BuffExpired, DebuffExpired
 *
 * ใช้ notifyType เพื่อแยก logic ภายใน execute()
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — notifyType/unit เลื่อนตามหลังเสมอ
 */
export class NotificationEvent extends CombatEvent {
    public readonly notifyType: NotificationType;

    /** unit ที่เกี่ยวข้องกับ notification นี้ (ถ้ามี) */
    public readonly unit: AllyUnit | null;

    constructor(name: string, notifyType: NotificationType, unit?: AllyUnit | null);
    constructor(name: string, time: number, notifyType: NotificationType, unit?: AllyUnit | null);
    constructor(name: string, time: number, priority: number, notifyType: NotificationType, unit?: AllyUnit | null);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [notifyType, unit] = rest as [NotificationType, AllyUnit | null | undefined];

        super(name, time, priority);
        this.notifyType = notifyType;
        this.unit       = unit ?? null;

        // NotificationEvent เป็นแค่ signal — ไม่รัน logic เอง (ใช้ default no-op execute จาก CombatEvent)
        // logic จริงถูกกำหนดโดย BattleField ตอน tick (เช็ค notifyType)
    }
}
