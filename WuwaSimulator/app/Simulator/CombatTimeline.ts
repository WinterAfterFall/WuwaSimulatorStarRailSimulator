import { NotificationType } from "../Constants/Enum";
import { AllyUnit } from "../Models/AllyUnit";
import { CombatEvent } from "../Models/Combat/CombatEvent/CombatEvent";
import { ActionEvent } from "../Models/Combat/CombatEvent/ActionEvent";
import { NotificationEvent } from "../Models/Combat/CombatEvent/NotificationEvent";
import { IndexedPriorityQueue } from "../Utils/indexedPriorityQueue";

/**
 * CombatTimeline — จัดการ event ทั้งหมดในการต่อสู้
 * ใช้ IndexedPriorityQueue<CombatEvent> เรียง event ตาม frame (น้อย = ออกก่อน)
 */
export class CombatTimeline {
    /** IPQ ที่เก็บ event ทั้งหมด */
    private ipq: IndexedPriorityQueue<CombatEvent>;

    /** frame ปัจจุบันของ simulation (1 วิ = 60 frame) */
    public currentFrame: number = 0;

    /** pointer ตัวละครที่ยืนบนสนามอยู่ */
    public onFieldChar: AllyUnit | null = null;

    /** block manual action ใหม่จาก RotationBuilder */
    public isGlobalLocked: boolean = false;

    constructor() {
        // เรียง event ที่ frame น้อยกว่าออกก่อน — ใช้ priority เป็น tie-breaker
        this.ipq = new IndexedPriorityQueue<CombatEvent>((a, b) => {
            const diff = a.time - b.time;
            return diff !== 0 ? diff : a.priority - b.priority;
        });
    }

    /** เพิ่ม event เข้า timeline */
    public schedule(event: CombatEvent): void {
        this.ipq.push(event, event.name);
    }

    /**
     * pop event ที่ frame น้อยสุด แล้ว execute
     * หลัง execute จะตรวจ NotificationEvent เพื่อจัดการ lock อัตโนมัติ
     */
    public tick(): CombatEvent | undefined {
        const event = this.ipq.pop();
        if (!event) return undefined;   

        this.currentFrame = event.time;
        event.execute();

        // ---- จัดการ lock หลัง execute ----
        if (event instanceof ActionEvent && event.isManual) {
            this.isGlobalLocked = true;
        }

        if (event instanceof NotificationEvent) {
            if (event.notifyType === NotificationType.ChangeToAuto) {
                // transition: ปล่อย GlobalLock แต่ unit ยัง Busy อยู่
                this.isGlobalLocked = false;
            }
            if (event.notifyType === NotificationType.EndAction) {
                // action จบ: ปล่อยทั้ง GlobalLock และ UnitLock
                this.isGlobalLocked = false;
                event.unit?.setFree();
            }
        }

        return event;
    }

    /** run event ทั้งหมดตามลำดับ frame จนหมด */
    public runAll(): void {
        while (!this.ipq.isEmpty) {
            this.tick();
        }
    }

    /** ดู event ถัดไปโดยไม่ pop */
    public peek(): CombatEvent | undefined {
        return this.ipq.peek();
    }

    public get isEmpty(): boolean {
        return this.ipq.isEmpty;
    }

    public get size(): number {
        return this.ipq.size;
    }
}
