import { ActionType } from "../../Constants/Enum";

/**
 * CombatEvent — node ที่เก็บไว้ใน IndexedPriorityQueue<CombatEvent>
 * แทน 1 เหตุการณ์ที่เกิดขึ้น ณ เวลาหนึ่งในการจำลองการต่อสู้
 */
export class CombatEvent {
    /** ชื่อ unique สำหรับใช้เป็น key ใน IPQ */
    public readonly name: string;

    /** เวลาที่ event นี้จะเกิดขึ้น (หน่วย: วินาที) — IPQ เรียงจากน้อยไปมาก */
    public time: number;

    /** ลำดับความสำคัญ — ใช้เป็น tie-breaker เมื่อ time เท่ากัน (น้อย = ออกก่อน) */
    public priority: number;

    /** ชื่อ action ที่ event นี้แทน */
    public readonly actionName: ActionType;

    /** โค้ดที่จะรันเมื่อ event นี้ถูก pop ออกจาก IPQ */
    private action: () => void;

    constructor(name: string, time: number, priority: number, actionName: ActionType, action: () => void) {
        this.name       = name;
        this.time       = time;
        this.priority   = priority;
        this.actionName = actionName;
        this.action     = action;
    }

    /** เรียกโดย CombatTimeline ตอน tick — รัน action ของ event นี้ */
    public execute(): void {
        this.action();
    }
}
