/**
 * CombatAction — base class ของ action ที่ถูก queue ไว้ก่อน schedule
 * ต่างจาก CombatEvent คือยังไม่มี `time` — จะถูกกำหนดทีหลังตอน schedule ลง CombatTimeline
 */
export abstract class CombatAction {
    /** ชื่อ unique สำหรับใช้เป็น key ตอนถูก schedule ลง IPQ */
    public readonly name: string;

    /** tie-breaker เมื่อ time เท่ากัน (น้อย = ออกก่อน) */
    public priority: number;

    /** กินเวลากี่ frame ตั้งแต่เริ่มจนจบ action */
    public duration: number;

    constructor(name: string, duration: number, priority: number = 0) {
        this.name     = name;
        this.duration = duration;
        this.priority = priority;
    }

    /** เรียกตอน action ถูก execute จริงใน timeline */
    public abstract execute(): void;
}
