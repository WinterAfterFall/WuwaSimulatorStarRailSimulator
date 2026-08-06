import { AllyUnit } from "../../AllyUnit";
import { BuffEvent } from "./BuffEvent";

/**
 * BuffStartEvent — บัพเริ่มมีผลกับ target
 * execute ยังไม่ตั้งค่าเอง (ใช้ default no-op จาก CombatEvent) — ตั้งทีหลังได้ผ่าน instance.execute = () => {...}
 *
 * ไม่มี duration เป็น field แล้ว — ไม่ใช่ "ข้อมูลของ event" จริงๆ แค่ค่าที่ใช้ครั้งเดียวตอน schedule
 * เพื่อบอกว่าจะ auto-schedule BuffEndEvent ตามมาไหม ส่งเข้า timeline.scheduleBuffStart(event, duration?) แทน
 */
export class BuffStartEvent extends BuffEvent {
}
