import { TimelineRef } from "../../Models/AllyUnit";
import { NotificationEvent } from "../../Models/Combat/CombatEvent/NotificationEvent";
import { NotificationType } from "../../Constants/Enum";

// notifyEndAction — schedule NotificationEvent(EndAction) ให้ตัวละครที่ยืนบนสนามอยู่ (timeline.onFieldChar)
// ชื่อ event: <actionName>-end ถ้าไม่ใส่ actionName จะใช้ <unit.name>-action-end แทน
export function notifyEndAction(timeline: TimelineRef, duration: number): void;
export function notifyEndAction(timeline: TimelineRef, duration: number, actionName: string): void;
export function notifyEndAction(timeline: TimelineRef, duration: number, actionName?: string): void {
    const unit = timeline.onFieldChar;
    const t    = timeline.currentFrame;
    const name = actionName ? `${actionName}-end` : `${unit?.name ?? "unknown"}-action-end`;

    const event = new NotificationEvent(`${name}-f${t}`, t + duration, NotificationType.EndAction, unit);
    // ปล่อย GlobalLock + ฟรีตัวละครตอน action จบ (ทำงานตอน tick ถึง frame นี้จริง ไม่ใช่ตอน schedule)
    event.execute = () => {
        timeline.isGlobalLocked = false;
        unit?.setFree();
    };
    timeline.schedule(event);
}
