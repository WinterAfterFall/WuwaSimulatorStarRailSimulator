import { Queue } from "../Utils/queue";
import { RotationAction } from "../Models/Combat/RotationAction";
import { BattleField } from "./BattleField";

/**
 * RotationDirector — ตัวกลางหลักที่ดึง RotationAction มา execute แล้วขับ BattleField
 * setupQueue ใช้ครั้งเดียวจนหมดก่อน แล้วค่อยใช้ loopQueue วนจน currentLoopCount === maxLoops
 */
export class RotationDirector {
    private setupQueue: Queue<RotationAction>;
    private loopQueue: Queue<RotationAction>;
    private battleField: BattleField;
    private maxLoops: number;

    /** นับ step ปัจจุบันภายใน 1 รอบของ loopQueue (reset เมื่อครบ loopQueue.length) */
    private loopStepCount: number = 0;

    /** จำนวนรอบของ loopQueue ที่ทำครบแล้ว */
    public currentLoopCount: number = 0;

    constructor(
        battleField: BattleField,
        setupQueue: Queue<RotationAction>,
        loopQueue: Queue<RotationAction>,
        maxLoops: number
    ) {
        this.battleField = battleField;
        this.setupQueue  = setupQueue;
        this.loopQueue   = loopQueue;
        this.maxLoops    = maxLoops;
    }

    /** รันจนกว่า action จะหมด (setup + loop ตาม maxLoops) แล้ว drain event ที่เหลือในคิว */
    public run(): void {
        while (this.step()) {}
        this.battleField.runAll();
    }

    /**
     * ทำ 1 รอบ: ถ้า global lock ว่าง → pop action ถัดไป → execute
     * แล้ว tick ไปเรื่อยๆ จนกว่า global lock จะปลดใหม่ ถึงจะกลับไปหา action ถัดไป
     */
    private step(): boolean {
        if (this.battleField.isGlobalLocked) return false;

        const action = this.nextAction();
        if (!action) return false;

        action.execute();

        do {
            this.battleField.tick();
        } while (this.battleField.isGlobalLocked && !this.battleField.isEmpty);

        return true;
    }

    /**
     * setupQueue ก่อน — หมดแล้วใช้ loopQueue วนจน currentLoopCount ครบ maxLoops
     *
     * ทุกครั้งที่ "จบ 1 ชุด" (setup drain หมด หรือ loop ครบ 1 รอบ) จะเพิ่ม
     * `battleField.rotationCount` ให้ 1 — ตัวนี้คือสิ่งที่ `SwapCharacterEvent` ใช้ตัดสินว่าถึงคิวใคร
     */
    private nextAction(): RotationAction | undefined {
        if (!this.setupQueue.isEmpty()) {
            const action = this.setupQueue.dequeue();

            // เพิ่งหยิบตัวสุดท้ายของ setup ออกไป = ชุด setup จบแล้ว
            if (this.setupQueue.isEmpty()) {
                this.battleField.endRotation();
            }

            return action;
        }

        if (this.loopQueue.isEmpty()) return undefined;
        if (this.currentLoopCount >= this.maxLoops) return undefined;

        const action = this.loopQueue.rotate();

        this.loopStepCount++;
        if (this.loopStepCount === this.loopQueue.length) {
            this.loopStepCount = 0;
            this.currentLoopCount++;
            this.battleField.endRotation();
        }

        return action;
    }
}
