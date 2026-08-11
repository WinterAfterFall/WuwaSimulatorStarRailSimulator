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

    /**
     * ส่วนของ battleField.rotationCount ที่มาจาก setupQueue จบ (0 หรือ 1 เท่านั้น) — เช็คครั้งเดียวตอนสร้าง
     * เพราะ setupQueue มีแต่หดลง ไม่มีทางเติมกลับ ค่านี้จึงไม่มีวันเปลี่ยนตลอดอายุ instance
     * ใช้หักออกจาก rotationCount ตอน derive currentLoopCount ด้านล่าง
     */
    private readonly setupRotationOffset: number;

    /**
     * หยิบ action ตัวสุดท้ายของชุดออกไปแล้ว รอปิดรอบ — ยังปิดตรงนั้นเลยไม่ได้
     *
     * ตอน `nextAction()` หยิบตัวสุดท้ายออกมา มันยัง **ไม่ได้ execute** ถ้า `endRotation()`
     * ทำงานตรงนั้น `SwapCharacterEvent` จะถูก schedule ที่ frame เดียวกับท่าสุดท้ายพอดี
     * แล้วสลับตัวตัดหน้าท่านั้น → ท่าสุดท้ายออกตอนเจ้าของไม่ได้อยู่บนสนาม → throw
     *
     * เลื่อนไปปิดที่ `step()` รอบถัดไปแทน ตอนนั้น lock ปลดแล้ว = ท่าสุดท้ายออกครบแล้วจริง
     */
    private pendingEndRotation: boolean = false;

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
        this.setupRotationOffset = setupQueue.isEmpty() ? 0 : 1;
    }

    /**
     * จำนวนรอบของ loopQueue ที่ทำครบแล้ว — derive จาก `battleField.rotationCount` ลบส่วนของ setupQueue ออก
     * แทนที่จะนับเองซ้ำอีกตัว (ดูที่มาของ rotationCount ใน `nextAction()` ด้านล่าง / `endRotation()`)
     *
     * ปลอดภัยที่จะอ่านค่านี้ทันทีหลัง `flushEndRotation()` เสมอ เพราะ `step()` เรียก flush
     * ก่อน `nextAction()` ทุกครั้ง — ตอนที่ค่านี้ถูกอ่านจริง (guard ใน `nextAction()` หรือตอน
     * `run()` จบ) rotationCount จึงนิ่งแล้วเสมอ ไม่มีช่วงที่ค่าค้างจาก step ก่อนหน้าให้เห็น
     */
    public get currentLoopCount(): number {
        return this.battleField.rotationCount - this.setupRotationOffset;
    }

    /** รันจนกว่า action จะหมด (setup + loop ตาม maxLoops) แล้ว drain event ที่เหลือในคิว */
    public run(): void {
        while (this.step()) {}

        // เผื่อ step สุดท้ายออกทางประตู isGlobalLocked (คิวหมดตอนยังล็อกค้าง) ซึ่งข้าม
        // การปิดรอบข้างในไป — ไม่ flush ตรงนี้ swap ปิดท้ายจะหายไปเงียบๆ
        this.flushEndRotation();
        this.battleField.runAll();
    }

    /** ปิดรอบที่ค้างอยู่ (ถ้ามี) — เรียกซ้ำได้ ครั้งที่สองเป็น no-op */
    private flushEndRotation(): void {
        if (!this.pendingEndRotation) return;

        this.pendingEndRotation = false;
        this.battleField.endRotation();
    }

    /**
     * ทำ 1 รอบ: ถ้า global lock ว่าง → pop action ถัดไป → execute
     * แล้ว tick ไปเรื่อยๆ จนกว่า global lock จะปลดใหม่ ถึงจะกลับไปหา action ถัดไป
     */
    private step(): boolean {
        if (this.battleField.isGlobalLocked) return false;

        // มาถึงตรงนี้ = lock ปลดแล้ว แปลว่าท่าสุดท้ายของชุดก่อนออกไปครบแล้ว ปิดรอบได้
        // ต้องอยู่ก่อน nextAction() เสมอ — swap ปิดท้ายต้องมาก่อน action แรกของรอบใหม่
        this.flushEndRotation();

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

            // เพิ่งหยิบตัวสุดท้ายของ setup ออกไป = ชุด setup จบแล้ว — ตั้งธงไว้ก่อน
            // ปิดจริงที่ step ถัดไป (ดูเหตุผลที่ pendingEndRotation)
            if (this.setupQueue.isEmpty()) {
                this.pendingEndRotation = true;
            }

            return action;
        }

        if (this.loopQueue.isEmpty()) return undefined;
        if (this.currentLoopCount >= this.maxLoops) return undefined;

        const action = this.loopQueue.rotate();

        this.loopStepCount++;
        if (this.loopStepCount === this.loopQueue.length) {
            this.loopStepCount = 0;
            this.pendingEndRotation = true;
        }

        return action;
    }
}
