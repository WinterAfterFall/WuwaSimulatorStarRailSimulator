import { TimelineRef } from "../../Models/AllyUnit";
import { NotificationEvent } from "../../Models/Combat/CombatEvent/NotificationEvent";
import { NotificationType } from "../../Constants/Enum";

// notifyChangeToAuto — schedule NotificationEvent(ChangeToAuto) ให้ตัวละครที่ยืนบนสนามอยู่ (timeline.onFieldChar)
// ชื่อ event: <actionName>-auto ถ้าไม่ใส่ actionName จะใช้ <unit.name>-change-to-auto แทน
// autoStartFrame = frame ที่ auto เริ่ม นับจากเริ่มท่า (ไม่ใช่ duration รวมทั้งท่าแบบ EndActionService)
export function notifyChangeToAuto(timeline: TimelineRef, autoStartFrame: number): void;
export function notifyChangeToAuto(timeline: TimelineRef, autoStartFrame: number, actionName: string): void;
export function notifyChangeToAuto(timeline: TimelineRef, autoStartFrame: number, actionName?: string): void {
    const unit = timeline.onFieldChar;
    const t    = timeline.currentFrame;
    const name = actionName ? `${actionName}-auto` : `${unit?.name ?? "unknown"}-change-to-auto`;

    const event = new NotificationEvent(`${name}-f${t}`, t + autoStartFrame, NotificationType.ChangeToAuto, unit);
    // ปล่อยแค่ GlobalLock — unit ยัง Busy อยู่ต่อ (ตาม Lock System: หลัง ChangeToAuto unit ไม่ฟรี)
    event.execute = () => {
        timeline.isGlobalLocked = false;
    };
    timeline.schedule(event);
}
