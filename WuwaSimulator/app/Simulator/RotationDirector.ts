import { Queue } from "../Utils/queue";
import { RotationAction } from "../Models/Combat/RotationAction";
import { CombatTimeline } from "./CombatTimeline";

/**
 * RotationDirector — ตัวกลางหลักที่ดึง RotationAction มา execute แล้วขับ CombatTimeline
 * setupQueue ใช้ครั้งเดียวจนหมดก่อน แล้วค่อยใช้ loopQueue วนจน currentLoopCount === maxLoops
 */
export class RotationDirector {
    private setupQueue: Queue<RotationAction>;
    private loopQueue: Queue<RotationAction>;
    private timeline: CombatTimeline;
    private maxLoops: number;

    /** นับ step ปัจจุบันภายใน 1 รอบของ loopQueue (reset เมื่อครบ loopQueue.length) */
    private loopStepCount: number = 0;

    /** จำนวนรอบของ loopQueue ที่ทำครบแล้ว */
    public currentLoopCount: number = 0;

    constructor(
        timeline: CombatTimeline,
        setupQueue: Queue<RotationAction>,
        loopQueue: Queue<RotationAction>,
        maxLoops: number
    ) {
        this.timeline   = timeline;
        this.setupQueue = setupQueue;
        this.loopQueue  = loopQueue;
        this.maxLoops   = maxLoops;
    }

    /** รันจนกว่า action จะหมด (setup + loop ตาม maxLoops) แล้ว drain event ที่เหลือใน timeline */
    public run(): void {
        while (this.step()) {}
        this.timeline.runAll();
    }

    /**
     * ทำ 1 รอบ: ถ้า global lock ว่าง → pop action ถัดไป → execute
     * แล้วรัน timeline ไปเรื่อยๆ จนกว่า global lock จะปลดใหม่ ถึงจะกลับไปหา action ถัดไป
     */
    private step(): boolean {
        if (this.timeline.isGlobalLocked) return false;

        const action = this.nextAction();
        if (!action) return false;

        action.execute();

        do {
            this.timeline.tick();
        } while (this.timeline.isGlobalLocked && !this.timeline.isEmpty);

        return true;
    }

    /** setupQueue ก่อน — หมดแล้วใช้ loopQueue วนจน currentLoopCount ครบ maxLoops */
    private nextAction(): RotationAction | undefined {
        if (!this.setupQueue.isEmpty()) {
            return this.setupQueue.dequeue();
        }

        if (this.loopQueue.isEmpty()) return undefined;
        if (this.currentLoopCount >= this.maxLoops) return undefined;

        const action = this.loopQueue.rotate();

        this.loopStepCount++;
        if (this.loopStepCount === this.loopQueue.length) {
            this.loopStepCount = 0;
            this.currentLoopCount++;
        }

        return action;
    }
}
