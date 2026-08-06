/**
 * CombatEvent — base class ของทุก event ใน CombatTimeline
 * ทุก event ที่จะ push ลง IPQ ต้อง extend class นี้
 */
export abstract class CombatEvent {
    /** ชื่อ unique สำหรับใช้เป็น key ใน IPQ */
    public readonly name: string;

    /**
     * frame ที่ event นี้จะเกิดขึ้น — IPQ เรียงจากน้อยไปมาก (1 วิ = 60 frame)
     * ปกติ CombatTimeline.schedule()/scheduleStartCombo()/scheduleBuffStart() เป็นคนตั้งค่านี้ให้
     * (currentFrame + offset) แต่ constructor ก็รับตรงๆ ได้เหมือนกันถ้าอยากตั้งเอง
     */
    public time: number;

    /** tie-breaker เมื่อ time เท่ากัน (น้อย = ออกก่อน) */
    public priority: number;

    /**
     * โค้ดที่ CombatTimeline จะเรียกตอน tick — เป็นตัวแปร (field) ไม่ใช่ method ตายตัว
     * เปลี่ยนค่าทีหลังได้เหมือนตัวแปรทั่วไป เช่น `event.execute = () => {...}`
     * default เป็น no-op เผื่อ subclass ไม่ได้ตั้งค่าเอง
     */
    public execute: () => void = () => {};

    constructor(name: string);
    constructor(name: string, time: number);
    constructor(name: string, time: number, priority: number);
    constructor(name: string, time: number = 0, priority: number = 0) {
        this.name     = name;
        this.time     = time;
        this.priority = priority;
    }
}
