import { IndexedPriorityQueue } from "../Utils/indexedPriorityQueue";
import { CombatEvent } from "../Models/Combat/CombatEvent";

/**
 * CombatTimeline — ตัวจัดการเวลากลางของการต่อสู้
 * ภายในใช้ IndexedPriorityQueue<CombatEvent> โดยเรียง event
 * ที่มี time น้อยกว่าออกก่อน (min-heap)
 */
export class CombatTimeline {
    /** IPQ ที่เก็บ event ทั้งหมด เรียงตาม time */
    private ipq: IndexedPriorityQueue<CombatEvent>;

    /** เวลาปัจจุบันของ simulation อัปเดตทุกครั้งที่ tick */
    public currentTime: number = 0;

    constructor() {
        // compare: time น้อยกว่า = ออกก่อน, ถ้า time เท่ากันให้ใช้ priority เป็น tie-breaker
        this.ipq = new IndexedPriorityQueue<CombatEvent>((a, b) => {
            const timeDiff = a.time - b.time;
            return timeDiff !== 0 ? timeDiff : a.priority - b.priority;
        });
    }

    /** เพิ่ม CombatEvent เข้า timeline */
    public schedule(event: CombatEvent): void {
        this.ipq.push(event, event.name);
    }

    /**
     * ดึง event ที่ time น้อยที่สุดออกมา แล้ว execute
     * @returns event ที่ถูก execute หรือ undefined ถ้า timeline ว่าง
     */
    public tick(): CombatEvent | undefined {
        const event = this.ipq.pop();
        if (!event) return undefined;

        this.currentTime = event.time;
        event.execute();
        return event;
    }

    /** รัน event ทั้งหมดตามลำดับ time จนหมด */
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
