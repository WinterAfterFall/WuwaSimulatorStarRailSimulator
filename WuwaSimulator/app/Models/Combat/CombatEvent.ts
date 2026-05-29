/**
 * CombatEvent — node ที่เก็บไว้ใน IndexedPriorityQueue<CombatEvent>
 * แทน 1 เหตุการณ์ที่เกิดขึ้น ณ เวลาหนึ่งในการจำลองการต่อสู้
 */
export class CombatEvent {
    /** ชื่อ unique สำหรับใช้เป็น key ใน IPQ */
    public readonly id: string;

    /** เวลาที่ event นี้จะเกิดขึ้น (หน่วย: วินาที) — IPQ เรียงจากน้อยไปมาก */
    public time: number;

    /** โค้ดที่จะรันเมื่อ event นี้ถูก pop ออกจาก IPQ */
    private action: () => void;

    constructor(id: string, time: number, action: () => void) {
        this.id     = id;
        this.time   = time;
        this.action = action;
    }

    /** เรียกโดย CombatTimeline ตอน tick — รัน action ของ event นี้ */
    public execute(): void {
        this.action();
    }
}
