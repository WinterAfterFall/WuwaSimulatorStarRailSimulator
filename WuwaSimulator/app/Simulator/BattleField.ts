import { CombatEvent } from "../Models/Combat/CombatEvent/CombatEvent";
import { ActionEvent } from "../Models/Combat/CombatEvent/ActionEvent";
import { BuffEndEvent } from "../Models/Combat/CombatEvent/BuffEndEvent";
import { ChangeToAuto } from "../Models/Combat/CombatEvent/ChangeToAuto";
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
    private ipq: IndexedPriorityQueue<CombatEvent>;

    /** frame ปัจจุบันของ simulation (1 วิ = 60 frame) */
    public currentFrame: number = 0;

    /** block ไม่ให้ RotationDirector ดึง manual action ตัวถัดไป */
    public isGlobalLocked: boolean = false;

    /**
     * @param triggerBus รวม listener ของทุกตัวละคร — ไม่ส่งมาก็สร้างของตัวเอง
     *                   (default param ถูก evaluate ใหม่ทุกครั้งที่ `new` จึงได้ instance แยกกันเสมอ)
     */
    constructor(public triggerBus: TriggerBus = new TriggerBus()) {
        this.ipq = new IndexedPriorityQueue<CombatEvent>((a, b) => {
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

    // ─────────────────────────────────────────────
    // เดินเวลา
    // ─────────────────────────────────────────────

    /**
     * pop event ที่ frame น้อยสุดออกมา execute แล้วจัดการ lock ตามชนิด event
     * ส่งตัวเองเข้าไปใน execute ด้วย — event จึงเอื้อมถึง roster/triggerBus ได้โดยไม่ต้องแนบมาตอนสร้าง
     */
    public tick(): CombatEvent | undefined {
        const event = this.ipq.pop();
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
