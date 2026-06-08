/**
 * CombatEvent — base class ของทุก event ใน CombatTimeline
 * ทุก event ที่จะ push ลง IPQ ต้อง extend class นี้
 */
export abstract class CombatEvent {
    /** ชื่อ unique สำหรับใช้เป็น key ใน IPQ */
    public readonly name: string;

    /** frame ที่ event นี้จะเกิดขึ้น — IPQ เรียงจากน้อยไปมาก (1 วิ = 60 frame) */
    public time: number;

    /** tie-breaker เมื่อ time เท่ากัน (น้อย = ออกก่อน) */
    public priority: number;

    /** กินเวลากี่ frame ตั้งแต่เริ่มจนจบ event */
    public duration: number;

    constructor(name: string, time: number, duration: number, priority: number = 0) {
        this.name     = name;
        this.time     = time;
        this.duration = duration;
        this.priority = priority;
    }

    /** เรียกโดย CombatTimeline ตอน tick */
    public abstract execute(): void;
}
