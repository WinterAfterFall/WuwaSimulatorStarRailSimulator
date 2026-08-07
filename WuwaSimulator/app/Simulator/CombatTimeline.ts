import { AllyUnit } from "../Models/AllyUnit";
import { CombatEvent } from "../Models/Combat/CombatEvent/CombatEvent";
import { ActionEvent } from "../Models/Combat/CombatEvent/ActionEvent";
import { BuffStartEvent } from "../Models/Combat/CombatEvent/BuffStartEvent";
import { BuffEndEvent } from "../Models/Combat/CombatEvent/BuffEndEvent";
import { ChangeToAuto } from "../Models/Combat/CombatEvent/ChangeToAuto";
import { IndexedPriorityQueue } from "../Utils/indexedPriorityQueue";
import { TriggerBus } from "./TriggerBus";
import { BattleField } from "./BattleField";

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

    /** รวม listener ของทุกตัวละคร — emit ตอน action ใดๆ trigger event กลาง (เช่น energy เพิ่ม) */
    public triggerBus: TriggerBus = new TriggerBus();

    /** ally/enemy ทั้งหมดของการต่อสู้นี้ — 1 timeline = 1 สนามรบ ไม่แชร์กับ timeline อื่น */
    public battleField: BattleField = new BattleField();

    constructor() {
        // เรียง event ที่ frame น้อยกว่าออกก่อน — ใช้ priority เป็น tie-breaker
        this.ipq = new IndexedPriorityQueue<CombatEvent>((a, b) => {
            const diff = a.time - b.time;
            return diff !== 0 ? diff : a.priority - b.priority;
        });
    }

    /**
     * เพิ่ม event เข้า timeline — ตั้ง event.time = currentFrame + offset ให้เอง (offset ไม่ใส่ = เกิดตอนนี้เลย)
     * ถ้าชื่อซ้ำกับ event ที่มีอยู่แล้วใน IPQ (เช่น scheduleBuffStart ถูกเรียกซ้ำเพื่อ refresh บัพเดิม)
     * จะ update() ตัวเดิมแทน push() ใหม่ — update() จัดเรียงตำแหน่งใน heap ให้ถูกต้องเองอยู่แล้ว
     */
    public schedule(event: CombatEvent): void;
    public schedule(event: CombatEvent, offset: number): void;
    public schedule(event: CombatEvent, offset: number = 0): void {
        event.time = this.currentFrame + offset;

        if (this.ipq.has(event.name)) {
            this.ipq.update(event.name, event);
        } else {
            this.ipq.push(event, event.name);
        }
    }

    /**
     * schedule ActionEvent (AttackActionEvent/BuffActionEvent) — ถ้ามี autoStartFrame จะ auto-schedule
     * ChangeToAuto คู่กันให้เอง (ปลด GlobalLock กลางท่า) — duration/EndAction ถูกถอดออกไปแล้ว
     * รอ combat event เกี่ยวกับการสลับตัวละครมาแทนที่
     */
    public scheduleStartCombo(event: ActionEvent, duration?: number, autoStartFrame?: number, offset: number = 0): void {
        event.time = this.currentFrame + offset;
        this.ipq.push(event, event.name);

        if (autoStartFrame !== undefined) {
            const changeToAuto = new ChangeToAuto(`${event.name}-change-to-auto`, this.onFieldChar);
            this.schedule(changeToAuto, offset + autoStartFrame);
        }
    }

    /**
     * schedule BuffStartEvent — duration (บัพอยู่ได้กี่ frame) ไม่ใช่ field ของ event แล้ว ส่งเข้ามาตรงนี้แทน
     * ถ้ามี duration จะ auto-schedule BuffEndEvent คู่กันให้เอง — ไม่ใส่ = บัพไม่มีวันหมดอายุเอง
     */
    public scheduleBuffStart(event: BuffStartEvent, duration?: number, offset: number = 0): void {
        this.schedule(event, offset);

        if (duration !== undefined) {
            this.schedule(new BuffEndEvent(`${event.name}-end`, event.target), offset + duration);
        }
    }

    /**
     * pop event ที่ frame น้อยสุด แล้ว execute
     * หลัง execute จะตรวจ ActionEvent/ChangeToAuto เพื่อจัดการ lock อัตโนมัติ
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

        if (event instanceof ChangeToAuto) {
            // transition: ปล่อย GlobalLock แต่ unit ยัง Busy อยู่
            this.isGlobalLocked = false;
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
