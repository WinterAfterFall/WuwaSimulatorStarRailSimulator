import { CombatEvent } from "../Models/Combat/CombatEvent/CombatEvent";
import { ActionEvent } from "../Models/Combat/CombatEvent/ActionEvent";
import { BuffEndEvent } from "../Models/Combat/CombatEvent/BuffEndEvent";
import { SwapCharacterEvent } from "../Models/Combat/CombatEvent/SwapCharacterEvent";
import { ActionFreeEvent } from "../Models/Combat/CombatEvent/ActionFreeEvent";
import { GlobalFreeEvent } from "../Models/Combat/CombatEvent/GlobalFreeEvent";
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
     * รอบ rotation ปัจจุบันของทั้งสนาม — เริ่มที่ 0
     *
     * `RotationDirector` เพิ่มค่านี้ทุกครั้งที่ drain setup queue จบ หรือวน loop queue ครบ 1 รอบ
     * ใช้คู่กับ `AllyUnit.rotationCount` เป็นตัวตัดสินว่า "ถึงคิวใคร": ตัวที่ค่าของตัวเอง
     * ยังเท่ากับค่าของสนาม แปลว่ายังไม่ได้ออกในรอบนี้ — `SwapCharacterEvent` จะหยิบตัวนั้น
     */
    public rotationCount: number = 0;

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
        enemy.enemyNum = this.enemies.length;
        this.enemies.push(enemy);
        return enemy;
    }

    /**
     * กรอง enemies ที่อยู่ในระยะของท่า — position น้อยกว่า range ถือว่าโดน
     * SkillRange.Single = "0" จึงคืน array ว่างเสมอ (ไม่มี position ไหนน้อยกว่า 0)
     */
    public enemiesInRange(range: SkillRange): EnemyUnit[] {
        return this.enemies.filter(e => Number(e.position) < Number(range));
    }

    /**
     * เรียกก่อนเริ่ม simulate รอบใหม่ — reset stats ของทุก unit กลับค่า default
     * แล้วล้างสถานะรันไทม์ทั้งหมดที่ combat จริง mutate ระหว่างสู้ ไม่ให้ค้างข้ามรอบ
     *
     * **ล้าง `dmgRecord`/`totalDamageRecord` ด้วย** เพราะสองตัวนี้แทน "ผลของรอบนี้รอบเดียว" —
     * ถ้าปล่อยให้สะสมข้ามรอบ การเทียบ `totalDamageRecord > maxTotalDamageRecord` ใน
     * `AllyUnit.updateMaxRecords()` จะเป็นจริงตลอดไปแบบไร้ความหมาย แล้ว substat reroll จะพัง
     *
     * **ไม่ล้าง `maxDmgRecord`/`maxTotalDamageRecord`** — สองตัวนั้นคือผลสรุปข้ามรอบ (record ตลอดกาล)
     * เป็นที่เก็บ "รอบที่ดีที่สุด" ให้ดูย้อนหลังได้หลังจบ optimize ทั้งหมด
     */
    public resetAllUnits(): void {
        for (const unit of [...this.allies, ...this.enemies]) {
            unit.initDefaultStats();
        }

        for (const ally of this.allies) {
            // echo คือของติดตัว ไม่ใช่ runtime state — ต้องบวกกลับเข้า stats ทุกครั้งหลัง initDefaultStats() ข้างบนล้างไป
            ally.applySubstats();

            // rotationCount ทั้งฝั่ง unit และฝั่งสนามต้องกลับไปที่ 0 พร้อมกัน
            // ถ้าเหลื่อมกันเมื่อไหร่ SwapCharacterEvent จะหาตัวที่ "ถึงคิว" ไม่เจอตั้งแต่รอบแรก
            ally.rotationCount = 0;

            ally.energy         = 0;
            ally.concentoEnergy = 0;
            ally.currentHP      = 0;
            ally.currentShield  = 0;

            ally.stacks.clear();
            ally.buffNote.clear();
            ally.gauges.clear();
            ally.buffCheck.clear();

            ally.dmgRecord.clear();
            ally.totalDamageRecord = 0;
        }

        for (const enemy of this.enemies) {
            enemy.debuffStacks.clear();
            enemy.debuffNote.clear();
            enemy.debuffCheck.clear();

            enemy.dmgRecord.clear();
            enemy.totalDamageRecord.length = 0;
        }

        this.rotationCount = 0;

        // เริ่มเกมด้วยตัวแรกในทีมเสมอ — รอบก่อนหน้าอาจทิ้ง onFieldChar ไว้ที่ตัวไหนก็ได้
        this.onFieldChar = this.allies[0] ?? null;
    }

    // ─────────────────────────────────────────────
    // schedule
    // ─────────────────────────────────────────────

    /**
     * เพิ่ม event เข้าคิว — ตั้ง event.time = currentFrame + offset ให้เอง (ไม่ใส่ offset = เกิดตอนนี้เลย)
     * ถ้าชื่อซ้ำกับ event ที่อยู่ในคิวแล้ว จะ update() ตัวเดิมแทน push() ใหม่
     * — update() จัดตำแหน่งใน heap ให้เองอยู่แล้ว
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
     * schedule action ของตัวละครที่ยืนอยู่บนสนาม (`isManual: true`)
     *
     * ล็อก GlobalLock ตลอดท่า — Director ดึง action ใหม่ไม่ได้จนกว่าจะปลด
     *
     * @param duration           ท่านี้ยาวกี่ frame — ใช้เป็นเวลาปลดล็อกถ้าไม่ส่ง changeToAutoTime
     * @param changeToAutoTime   frame ที่ท่าเปลี่ยนเป็น auto — schedule `GlobalFreeEvent` ปลด
     *                           GlobalLock **ก่อน** ท่าจบ (unit ยัง Busy ต่อจนถึง duration)
     *                           ไม่ส่ง = ล็อกยาวจนจบท่า
     * @param execute          **ทับ** execute ของ event ทั้งก้อน (ไม่ใช่ต่อท้าย) — ใส่แล้ว check
     *                           `isManual` ต้องอยู่บนสนาม กับ `setBusy()` ของเดิมจะไม่ทำงาน
     *                           ไม่ส่งมา = ใช้ execute เดิมตามปกติ
     *                           รับ `battleField` เหมือน `CombatEvent.execute` — จะไม่ใช้ก็ละไว้ได้
     */
    public scheduleStartOnFieldAction(
        event: ActionEvent,
        duration: number,
        changeToAutoTime?: number,
        execute?: (battleField: BattleField) => void,
    ): void {
        // ทับ execute เดิมทั้งก้อน ไม่ใช่ต่อท้าย — ไม่ส่งมาก็ปล่อยของเดิมไว้
        if (execute) event.execute = execute;

        // แล้วเสียบ "ขาล็อก" ไว้หน้าสุดเสมอ — ทำหลังการทับ จึงรับประกันว่าถึงคนเรียกจะส่ง
        // execute ของตัวเองมาทับทั้งก้อน unit ก็ยังถูกตั้ง Busy และ GlobalLock ก็ยังถูกล็อกอยู่ดี
        //
        // คู่ปลดคือ ActionFreeEvent.onField ที่ schedule ไว้ปลายท่าข้างล่าง — ออกจากที่เดียวกัน
        // ทั้งขาล็อกและขาปลด จึงไม่มีทางล็อกแล้วลืมปลด
        this.isGlobalLocked = true;
        const base = event.execute;
        event.execute = (battleField) => {
            event.unit.setBusy();
            base(battleField);
        };

        // event.time ที่ตั้งมาตอนสร้างทำหน้าที่เป็น offset (default 0 = ออกเดี๋ยวนี้)
        // schedule บวก currentFrame ให้อีกที → ผลคือ time += t
        this.schedule(event, event.time);

        // ปลายท่า: คืน unit เป็น Free แล้วปลด GlobalLock ในตัวเดียวกัน
        this.schedule(ActionFreeEvent.onField(`${event.name}-free`, event.unit), duration);

        // ท่าที่เปลี่ยนเป็น auto กลางคัน — ปลด GlobalLock ก่อนท่าจบ ให้ Director สั่งตัวถัดไปได้
        // ส่วน unit ยังติดแอนิเมชันต่อจนถึง duration (ActionFreeEvent ข้างบนเป็นคนคืน Free)
        if (changeToAutoTime !== undefined) {
            this.schedule(new GlobalFreeEvent(`${event.name}-to-auto`, event.unit), changeToAutoTime);
        }
    }

    /**
     * schedule action ของตัวละครที่ไม่ได้อยู่บนสนาม (`isManual: false`)
     *
     * ไม่แตะ GlobalLock เลย — ท่าแบบนี้เกิดคู่ขนานไปกับตัวที่ยืนอยู่ได้ (เช่น `ActionType.CoordAtk`)
     *
     * @param duration   ท่านี้ยาวกี่ frame — ยังไม่มีใครใช้จนกว่า unit lock (actionState) จะต่อสาย
     * @param onExecute  **ทับ** execute ของ event ทั้งก้อน (ไม่ใช่ต่อท้าย) — ไม่ส่งมา = ใช้ของเดิม
     *                  รับ `battleField` เหมือน `CombatEvent.execute` — จะไม่ใช้ก็ละไว้ได้
     */
    public scheduleStartOffFieldAction(
        event: ActionEvent,
        duration: number,
        execute?: (battleField: BattleField) => void,
    ): void {

        if (execute) event.execute = execute;

        const base = event.execute;
        event.execute = (battleField) => {
            event.unit.setBusy();
            base(battleField);
        };

        // event.time ที่ตั้งมาตอนสร้างทำหน้าที่เป็น offset (default 0 = ออกเดี๋ยวนี้)
        // schedule บวก currentFrame ให้อีกที → ผลคือ time += t
        this.schedule(event, event.time);
        this.schedule(ActionFreeEvent.offField(`${event.name}-free`, event.unit), duration);
    }

    /**
     * ต่อ callback ท้าย execute เดิมของ event — ของเดิมยังทำงานครบเหมือนไม่มีอะไรมาแทรก
     *
     * เป็นทางเดียวที่ควรใช้ใส่ "ผลข้างเคียงเฉพาะท่า" (log, บวก stack, ติดบัพ) หลัง `ActionEvent`
     * เลิกรับ `onExecute` ทาง constructor แล้ว — ใช้ได้กับ event ทุกชนิด ไม่ใช่แค่ ActionEvent
     *
     * ⚠️ อย่าเขียน `event.execute = fn` เอง เพราะนั่นคือการ **ทับ** ไม่ใช่ต่อท้าย —
     * check/setBusy ของ event เดิมจะหายไปเงียบๆ
     */
    public appendOnExecute(event: CombatEvent, execute?: (battleField: BattleField) => void): void {
        if (!execute) return;

        const base = event.execute;
        event.execute = (battleField) => {
            base(battleField);
            execute(battleField);
        };
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
     * จบ rotation 1 ชุด (setup drain หมด หรือ loop ครบ 1 รอบ) — ขึ้นรอบใหม่แล้วสลับตัวปิดท้าย
     *
     * 1 rotation ตัวละครทุกตัวต้องได้ลงสนามครบ ดังนั้น rotation เป็นคนสั่ง swap เอง N-1 ครั้ง
     * (N = จำนวนตัวในทีม) ส่วนครั้งสุดท้ายที่วนกลับไปตัวแรก ระบบออกให้ตรงนี้
     */
    public endRotation(): void {
        this.rotationCount++;
        this.schedule(new SwapCharacterEvent());
    }

    // ─────────────────────────────────────────────
    // เดินเวลา
    // ─────────────────────────────────────────────

    /**
     * pop event ที่ frame น้อยสุดออกมาแล้ว execute
     * ส่งตัวเองเข้าไปใน execute ด้วย — event จึงเอื้อมถึง roster/triggerBus ได้โดยไม่ต้องแนบมาตอนสร้าง
     *
     * ไม่แตะ lock เอง — ล็อกถูกตั้งไปแล้วตอน schedule (`scheduleStartOnFieldAction`)
     * ก่อนหน้านี้เคยมี branch เช็ค `ActionEvent.isManual` ตรงนี้ ลบทิ้งเพราะเป็นของซ้ำ:
     * ทุก manual action เข้าคิวผ่าน `scheduleStartOnFieldAction` เท่านั้น (ล็อกไปแล้ว) และทุก
     * off-field action ส่ง `isManual: false` มาเสมอ ไม่มี code path ไหนที่ branch นี้ยังจำเป็นอยู่ —
     * เหลือไว้มีแต่ความเสี่ยง: ถ้าใครวันหลัง schedule manual action ผ่าน `schedule()` ตรงๆ
     * ข้าม `scheduleStartOnFieldAction` ไป branch นี้จะล็อกให้แบบไม่มีคู่ปลดทันที
     */
    public tick(): CombatEvent | undefined {
        const event = this.timeline.pop();
        if (!event) return undefined;

        this.currentFrame = event.time;
        event.execute(this);

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
