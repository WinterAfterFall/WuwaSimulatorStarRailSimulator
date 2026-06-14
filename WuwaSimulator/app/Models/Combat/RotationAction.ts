/**
 * RotationAction — base class ของ action ที่ถูก queue ไว้ก่อน schedule
 * ต่างจาก RotationEvent คือยังไม่มี `time` — จะถูกกำหนดทีหลังตอน schedule ลง RotationTimeline
 */
export class RotationAction {
    /** ชื่อ unique สำหรับใช้เป็น key ตอนถูก schedule ลง IPQ */
    public readonly name: string;

    public readonly execute: () => void;

    constructor(name: string, execute: () => void) {
        this.name     = name;
        this.execute  = execute;
    }
}
