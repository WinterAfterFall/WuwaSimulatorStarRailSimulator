import { CombatEvent } from "../Models/Combat/CombatEvent/CombatEvent";
import { ActionEvent } from "../Models/Combat/CombatEvent/ActionEvent";
import { BuffEndEvent } from "../Models/Combat/CombatEvent/BuffEndEvent";
import { ChangeToAuto } from "../Models/Combat/CombatEvent/ChangeToAuto";
import { GlobalLockChange } from "../Models/Combat/CombatEvent/GlobalLockChange";
import { EnemyUnit } from "../Models/EnemyUnit";
import { IndexedPriorityQueue } from "../Utils/IndexedPriorityQueue";
import { TriggerBus } from "./TriggerBus";
import { increaseEnergy } from "../Services/Combat/EnergyService";
import { SkillRange } from "../Constants/Enum";
import type { AllyUnit } from "../Models/AllyUnit";
import type { BuffStartEvent } from "../Models/Combat/CombatEvent/BuffStartEvent";
import type { Damage } from "../Models/Combat/Damage";

/**
 * BattleField — การต่อสู้ 1 ครั้ง: ใครอยู่ในสนาม และอะไรเกิดขึ้นเมื่อไหร่
 *
 * รวม roster (ally/enemy) กับคิว event เข้าไว้ด้วยกัน เพราะทุกจุดที่ใช้ตัวหนึ่งก็ต้องใช้อีกตัวเสมอ
 * แยกเป็นสองคลาสแล้วไม่มีใครได้ประโยชน์ มีแต่ต้องส่งต่อกันไปมา (ดู "หลักการออกแบบ" ใน CLAUDE.md)
 *
 * 1 instance = 1 การต่อสู้ที่แยกขาดจากกันสมบูรณ์ — ไม่มี state รั่วข้ามรอบ simulate
 */
export class BattleField {

    // ─────────────────────────────────────────────
    // ใครอยู่ในสนาม
    // ─────────────────────────────────────────────

    public allies : AllyUnit[]  = [];
    public enemies: EnemyUnit[] = [];

    /** pointer ตัวละครที่ยืนบนสนามอยู่ตอนนี้ */
    public onFieldChar: AllyUnit | null = null;

    // ─────────────────────────────────────────────
    // เวลาและคิว event
    // ─────────────────────────────────────────────

    /** IPQ ที่เก็บ event ทั้งหมด — เรียงตาม frame (น้อย = ออกก่อน) */
    private timeline: IndexedPriorityQueue<CombatEvent>;

    /** frame ปัจจุบันของ simulation (1 วิ = 60 frame) */
    public currentFrame: number = 0;

    /** block ไม่ให้ RotationDirector ดึง manual action ตัวถัดไป */
    public isGlobalLocked: boolean = false;

    /**
     * @param triggerBus รวม listener ของทุกตัวละคร — ไม่ส่งมาก็สร้างของตัวเอง
     *                   (default param ถูก evaluate ใหม่ทุกครั้งที่ `new` จึงได้ instance แยกกันเสมอ)
     */
    constructor(public triggerBus: TriggerBus = new TriggerBus()) {
        this.timeline = new IndexedPriorityQueue<CombatEvent>((a, b) => {
            const diff = a.time - b.time;
            return diff !== 0 ? diff : a.priority - b.priority;
        });
    }

    // ─────────────────────────────────────────────
    // จัดการ unit
    // ─────────────────────────────────────────────

    /** สร้าง EnemyUnit (stats พื้นฐาน default อยู่แล้วใน class) แล้ว push เข้า enemies ให้เลย */
    public createEnemy(name: string): EnemyUnit {
        const enemy = new EnemyUnit(name);
        this.enemies.push(enemy);
        return enemy;
    }

    /**
     * กรอง enemies ที่อยู่ในระยะของท่า — position น้อยกว่า range ถือว่าโดน
     * SkillRange.None = "0" จึงคืน array ว่างเสมอ (ไม่มี position ไหนน้อยกว่า 0)
     */
    public enemiesInRange(range: SkillRange): EnemyUnit[] {
        return this.enemies.filter(e => Number(e.position) < Number(range));
    }

    /** เรียกก่อนเริ่ม simulate รอบใหม่ — reset stats ของทุก unit กลับค่า default */
    public resetAllUnits(): void {
        for (const unit of [...this.allies, ...this.enemies]) {
            unit.initDefaultStats();
        }
    }

    // ─────────────────────────────────────────────
    // schedule
    // ─────────────────────────────────────────────

    /**
     * เพิ่ม event เข้าคิว — ตั้ง event.time = currentFrame + offset ให้เอง (ไม่ใส่ offset = เกิดตอนนี้เลย)
     * ถ้าชื่อซ้ำกับ event ที่อยู่ในคิวแล้ว (เช่น scheduleBuffStart ถูกเรียกซ้ำเพื่อ refresh บัพเดิม)
     * จะ update() ตัวเดิมแทน push() ใหม่ — update() จัดตำแหน่งใน heap ให้เองอยู่แล้ว
     */
    public schedule(event: CombatEvent): void;
    public schedule(event: CombatEvent, offset: number): void;
    public schedule(event: CombatEvent, offset: number = 0): void {
        event.time = this.currentFrame + offset;

        if (this.timeline.has(event.name)) {
            this.timeline.update(event.name, event);
        } else {
            this.timeline.push(event, event.name);
        }
    }

    /**
     * schedule event พร้อม "ช่วงเวลาที่ GlobalLock ถูกล็อก" ครอบให้ในครั้งเดียว
     *
     * event เกิดที่ `currentFrame` เสมอ (คอมโบเริ่ม "เดี๋ยวนี้") จึงไม่มี offset ให้ใส่ —
     * `duration` ทำหน้าที่เป็น offset ของ lock-off อยู่แล้ว ท่าที่ต้องเริ่มช้ากว่านี้ให้ใช้
     * `schedule(event, offset)` ตรงๆ แทน (ท่ากลางคอมโบทำแบบนั้นอยู่)
     *
     * push `GlobalLockChange` คู่หนึ่งคร่อมหัวท้ายให้เอง:
     *   - value 1 ที่ frame เดียวกับ event  → ล็อก
     *   - value 0 ที่ frame + duration      → ปลด
     *
     * ออก event คู่จากที่เดียวเสมอ = ไม่มีทางล็อกแล้วลืมปลด ซึ่งเป็นบั๊กที่เคยเกิดจริงมาแล้ว
     * 2 รอบสมัยที่ lock ถูกกดผ่าน `isManual` แล้วรอ EndAction ที่อยู่กันคนละที่มาปลด
     *
     * @throws ถ้า duration ติดลบ — ช่วงล็อกที่จบก่อนเริ่มไม่มีความหมาย ให้ดังตั้งแต่ตอน schedule
     *         ดีกว่าปล่อยให้ lock ค้างเงียบๆ ตอนรัน
     */
    public scheduleStartCombo(event: CombatEvent, duration: number): void {
        if (duration < 0) {
            throw new Error(`Invalid lock duration for "${event.name}": ${duration}`);
        }

        this.schedule(event);
        this.schedule(new GlobalLockChange(`${event.name}-lock-on`,  1));
        this.schedule(new GlobalLockChange(`${event.name}-lock-off`, 0), duration);
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

    // ─────────────────────────────────────────────
    // เดินเวลา
    // ─────────────────────────────────────────────

    /**
     * pop event ที่ frame น้อยสุดออกมา execute แล้วจัดการ lock ตามชนิด event
     * ส่งตัวเองเข้าไปใน execute ด้วย — event จึงเอื้อมถึง roster/triggerBus ได้โดยไม่ต้องแนบมาตอนสร้าง
     */
    public tick(): CombatEvent | undefined {
        const event = this.timeline.pop();
        if (!event) return undefined;

        this.currentFrame = event.time;
        event.execute(this);

        if (event instanceof ActionEvent && event.isManual) {
            this.isGlobalLocked = true;
        }

        if (event instanceof ChangeToAuto) {
            // transition: ปล่อย GlobalLock แต่ unit ยัง Busy อยู่
            this.isGlobalLocked = false;
        }

        return event;
    }

    /** run event ทั้งหมดตามลำดับ frame จนหมดคิว */
    public runAll(): void {
        while (!this.timeline.isEmpty) {
            this.tick();
        }
    }

    /** ดู event ถัดไปโดยไม่ pop */
    public peek(): CombatEvent | undefined {
        return this.timeline.peek();
    }

    public get isEmpty(): boolean {
        return this.timeline.isEmpty;
    }

    public get size(): number {
        return this.timeline.size;
    }

    // ─────────────────────────────────────────────
    // ทรัพยากรจากการตี
    // ─────────────────────────────────────────────

    /**
     * จ่ายทรัพยากรที่ผู้ตีได้จากท่านี้ — energy / concento / gauge
     * แยกจาก calculateDamage เพราะเป็นคนละเรื่องกับสูตรดาเมจ และอยู่ตรงนี้แล้วคนเรียกไม่ต้องถือ triggerBus เอง
     */
    public applyResourceGain(damage: Damage): void {
        const attacker = damage.attacker;

        if (damage.energyGain !== undefined) {
            increaseEnergy(attacker, damage.energyGain, this.triggerBus, damage.attackTypeList[0]);
        }

        if (damage.concentoEnergyGain !== undefined) {
            attacker.concentoEnergy += damage.concentoEnergyGain;
        }

        for (const [name, value] of damage.gauges) {
            attacker.gauges.set(name, (attacker.gauges.get(name) ?? 0) + value);
        }
    }
}
