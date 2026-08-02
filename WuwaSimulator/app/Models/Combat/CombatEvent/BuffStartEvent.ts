import { BuffEvent } from "./BuffEvent";

/**
 * BuffStartEvent — บัพเริ่มมีผลกับ target
 * execute ยังไม่ตั้งค่าเอง (ใช้ default no-op จาก CombatEvent) — ตั้งทีหลังได้ผ่าน instance.execute = () => {...}
 */
export class BuffStartEvent extends BuffEvent {
}
