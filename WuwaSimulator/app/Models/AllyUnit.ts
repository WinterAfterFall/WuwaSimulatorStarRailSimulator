import { Unit } from "./Unit";
import { StatsType, ActionType, ElementType, WeaponType, ActionState } from "../Constants/Enum";
import { Queue } from "../Utils/queue";
import { RotationAction } from "./Combat/RotationAction";
import type { BattleField } from "../Simulator/BattleField";
import type { EnemyUnit } from "./EnemyUnit";
import { EchoSubstats } from "../extra/substats/EchoSubstats";
import { SUBSTAT_VALUES } from "../extra/substats/SubstatValueData";
import { getTableKeyForStat } from "../extra/substats/SubstatData";
import { getTuneUpChance, pickBestTuneUpSlot, pickBestDecreaseSlot } from "../extra/substats/SubstatProbability";

// จำนวน substat type ทั้งหมดที่มีในเกม (main 9 + crit 2 + flatAtk 1 + flatDef 1) — ใช้เป็นตัวหารตั้งต้นใน setSubstats()
const TOTAL_SUBSTAT_POOL = 13;

export class AllyUnit extends Unit {

    // --- Combat State ---
    public isOnField: boolean = false               // ยืนบนสนามอยู่ไหม
    public actionState: ActionState = ActionState.Free  // ว่าง หรือ กำลัง action

    // --- Base Stats ---
    public level   : number = 90;
    public baseAtk : number = 0;
    public baseHp  : number = 0;
    public baseDef : number = 0;

    // --- Character Info ---
    public elementType    : ElementType = ElementType.None;
    public weaponType     : WeaponType  = WeaponType.None;
    public resonanceChain : number = 0; // C ตัวละครอ่ะ

    // --- Rotation Definitions ---
    /** key = ชื่อ rotation, value = factory รับ battleField แล้วคืน Queue<RotationAction> */
    public rotations: Map<string, (battleField: BattleField) => Queue<RotationAction>> = new Map();

    // --- Swap Skills ---
    // ตัวละครที่ไม่มีท่านี้ไม่ต้อง set — ปล่อย undefined ไว้ (ไม่ใช่ทุกตัวมี outro/intro/ultimate)
    public outroSkill?: (battleField: BattleField) => void;
    public introSkill?: (battleField: BattleField) => void;
    public ultimate?: (battleField: BattleField) => void;
    public echoSkill?: (battleField: BattleField) => void;

    /**
     * rotation ของตัวนี้ถูกสั่งไปแล้วกี่ครั้ง — **นับเฉพาะของ unit ตัวนี้**
     * (คนละเรื่องกับ `RotationDirector.currentLoopCount` ที่นับรอบของ loopQueue ทั้งทีม)
     *
     * เพิ่มค่าตอน action เริ่ม execute จริง ก่อน schedule อะไรลงคิว — ระหว่างรอบแรกจึงอ่านได้ `1`
     * ตรงกับคำว่า "ครั้งที่ 1" ไม่ใช่ 0
     *
     * ใช้เขียน rotation ที่พฤติกรรมต่างกันตามรอบ เช่น
     * `if (unit.rotationCount === 1) { ...เปิดด้วย Ult... } else { ...คอมโบปกติ... }`
     *
     * ถูก reset เป็น 0 ทุกครั้งที่ `BattleField.resetAllUnits()` ทำงาน (ต้นรอบ `sim.run()`)
     */
    public rotationCount: number = 0;

    // --- Energy ---
    public energy    : number = 0;
    public maxEnergy : number = 0;
    public ultCost   : number = 0;   // พลังงานที่ต้องใช้กด Ultimate — เช็คตอน CastUltimateEvent execute

    // --- Concerto Energy ---
    public concentoEnergy    : number = 0;
    public maxConcentoEnergy : number = 100;

    // --- HP / Shield ---
    public currentHP     : number = 0;
    public currentShield : number = 0;

    // --- Buff Tracking ---
    public stacks    : Map<string, number>  = new Map();//ใช้สำหรับนับ stack ของบัพในแต่ละชื่อ
    public buffNote  : Map<string, number>  = new Map();
    public gauges    : Map<string, number>  = new Map();
    public buffCheck : Map<string, boolean> = new Map();

    // --- Roster Position ---
    public allyNum: number = 0; // ลำดับของตัวละครนี้ในทีม (index ใน battleField.allies) — ตั้งให้ตอน Simulate.addAlly()

    // --- Damage Record (รวมทุกท่า ไม่แยกตามชื่อ — แยกตามชื่อดูที่ dmgRecord/maxDmgRecord ของ Unit) ---
    /** ผลรวมดาเมจทั้งหมดที่ตัวละครนี้ตีในรอบปัจจุบัน */
    public totalDamageRecord    : number = 0;
    /** totalDamageRecord ของรอบที่ทำดาเมจได้มากที่สุดเท่าที่เคยมี — อัพเดตผ่าน updateMaxRecords() เท่านั้น */
    public maxTotalDamageRecord : number = 0;

    // --- Echo Substats ---
    public substats?: EchoSubstats[];
    public bestSubstats?: EchoSubstats[];
    public luckBudget: number = 0; // ค่า prob ขั้นต่ำที่ยอมรับได้ (ระดับดวง) — budget เริ่มต้นของ algorithm เช็คว่ารับ substat level ไหนเพิ่มได้ไหม
    /** luckBudget ณ ตอนที่ bestSubstats ถูกเซฟ — ต้องเดินคู่กับ bestSubstats เสมอ (ดู saveBest()/restoreBest()) */
    public bestLuckBudget: number = 0;

    // --- Substat Reroll (สับเปลี่ยน point ระหว่าง substat ท้ายรอบ sim — พอร์ตมาจาก StarRailSimulator's
    //     StandardReroll แปลงจากโมเดล "แต้ม quota รวม" ของ StarRail มาเป็นโมเดล "tier ต่อช่อง" ของ WuWa) ---
    /** ตัวที่กำลังปั๊มอยู่ตอนนี้ — index ใน substats[] (เริ่มที่ 1 เพราะตัวที่ 0 ใช้ logic tune ของ setSubstats() เอง) */
    public rerollSubstatIndex: number = 1;
    /** source ที่กำลังสไลด์ทดสอบอยู่ตอนนี้ใน sweep ปัจจุบัน — ไล่ขึ้นจาก 0 ไปหา rerollSubstatIndex-1
     *  -1 = ยังไม่เริ่ม sweep ใหม่ (sentinel) reset กลับ -1 ทุกครั้งที่จะเริ่ม sweep ใหม่
     *  (ทั้งตอนขึ้น target ใหม่ และตอน retry sweep เดิมหลังเจอ improvement) */
    public rerollSourceIndex: number = -1;
    /** เจอ improvement (ผ่าน updateMaxRecords()) ระหว่าง sweep ปัจจุบันของ rerollSubstatIndex นี้ไหม —
     *  true = ตั้งโดย updateMaxRecords() เอง — ใช้ตัดสินตอน sweep จบว่าจะ retry sweep เดิมซ้ำ (ยังมีลุ้น)
     *  หรือเลื่อนไป target ถัดไป (ไม่มีอะไรดีขึ้นเลยทั้ง sweep) */
    public rerollImproved: boolean = false;

    constructor(name: string) {
        super(name);
        // ค่าตั้งต้นของทุกตัวละคร (ก่อนบวก Echo/อาวุธ/บัพ) — Crit Rate 5% / Crit DMG 150%
        this.setDefaultStat(StatsType.CR, 5);
        this.setDefaultStat(StatsType.CD, 150);
        this.initDefaultStats();
    }

    public isFree(): boolean {
        return this.actionState === ActionState.Free;
    }

    public setBusy(): void {
        this.actionState = ActionState.Busy;
    }

    public setFree(): void {
        this.actionState = ActionState.Free;
    }

    /**
     * ตั้ง substats/bestSubstats/luckBudget ให้ตัวละครทีเดียว
     *
     * substats/bestSubstats ถูกสร้างจาก statsTypes ตามลำดับ (size = statsTypes.length ทั้งสองฝั่ง)
     * แต่ละ entry เป็น `new EchoSubstats(type, actionType)` — level เริ่มเป็น array 5 ตัว (1 ต่อ echo)
     * ค่า 1 ทั้งหมด ตามที่กำหนดไว้ใน constructor ของ EchoSubstats เอง
     *
     * luckBudget หารต่อเนื่องด้วย pattern: (size)/13 · (size-1)/12 · (size-2)/11 · ... · 1/(13-size+1)
     * (13 = จำนวน substat type ทั้งหมดที่มีในเกม) — ถ้าใส่ num1/num2 มาด้วย num2 พจน์สุดท้าย
     * (นับจากพจน์ท้ายสุดของ pattern) จะบวก num1 เข้ากับตัวเศษก่อนหาร
     */
    public setSubstats(
        luckBudget: number,
        statsTypes: { type: StatsType; actionType?: ActionType }[],
        num1?: number,
        num2?: number,
    ): void {
        const size = statsTypes.length;

        this.substats     = statsTypes.map(({ type, actionType }) => new EchoSubstats(type, actionType));
        this.bestSubstats = statsTypes.map(({ type, actionType }) => new EchoSubstats(type, actionType));

        let budget = luckBudget;
        for (let i = 0; i < size; i++) {
            let numerator = size - i;
            const denominator = TOTAL_SUBSTAT_POOL - i;

            if (num1 !== undefined && num2 !== undefined && i >= size - num2) {
                numerator += num1;
            }

            budget /= numerator / denominator;
        }

        this.luckBudget = budget;

        // --- tune tier ของ substats[0] ---
        // เทียบคู่ level[n]/level[n+1] ทีละคู่ ฝั่งที่โอกาส tune ขึ้นสูงกว่าหรือเท่ากันชนะ (เอนซ้าย) —
        // ชนะแล้วเพิ่ม tier ทันที เช็ค n เดิมซ้ำ (อาจชนะต่อได้อีก) แพ้ค่อยเลื่อนไปเช็คคู่ถัดไป
        // ถึงช่องสุดท้าย (ไม่มีคู่ให้เทียบแล้ว) ให้เช็คเดี่ยวๆ แล้ววนกลับ n=0 ใหม่ — จบเมื่อ luckBudget ไม่พอ
        //
        // หมายเหตุ: ตั้งใจ "จำ n" ไว้ข้าม iteration ของ loop นี้ (ไม่ใช้ pickBestTuneUpSlot ซึ่ง scan จาก
        // index 0 ใหม่ทุกครั้ง) เพราะถ้า scan ใหม่ทุกรอบ ผลจะเอนเอียงกลับไปช่องต้นๆ ซ้ำๆ แทนที่จะ sweep
        // ทั่วถึงทุกช่องเหมือนที่ตั้งใจไว้ — ทดสอบแล้วผลต่างจริง (level กระจายไม่เท่ากันถ้า scan ใหม่ทุกครั้ง)
        const level = this.substats[0].level;
        const tableKey = getTableKeyForStat(this.substats[0].type);
        let n = 0;
        while (true) {
            const isLastSlot = n === level.length - 1;
            const chanceN = getTuneUpChance(tableKey, level[n]) / 100;

            if (!isLastSlot) {
                const chanceN1 = getTuneUpChance(tableKey, level[n + 1]) / 100;
                if (chanceN < chanceN1) {
                    n++;
                    continue;
                }
            }

            // tier ชนสูงสุดแล้ว (chanceN === 0) ไม่มีอะไรให้ tune ต่อ — เช็คตรงๆ แทนหวังพึ่ง
            // budget/chanceN === Infinity เพราะ budget === 0 (เคสจริง) ทำให้ 0/0 === NaN แล้ว NaN>1 เป็น false วนไม่รู้จบ
            if (chanceN === 0) break;

            const afterTune = this.luckBudget / chanceN;
            if (afterTune > 1) break;

            level[n] += 1;
            this.luckBudget = afterTune;
            if (isLastSlot) n = 0;
        }

        // bestSubstats ต้องตรงกับ substats ที่เพิ่ง tune เสร็จเสมอ — ยังไม่มีผลดาเมจจริงมาเทียบเลย
        // ตอนนี้ configuration นี้จึงถือเป็น "ดีที่สุดเท่าที่รู้" โดยปริยาย (rerollSubstats() ใช้เป็น baseline)
        this.saveBest();
    }

    private cloneSubstat(source: EchoSubstats): EchoSubstats {
        const copy = new EchoSubstats(source.type, source.actionType);
        copy.level = [...source.level];
        return copy;
    }

    /**
     * เซฟ config ปัจจุบันเป็น "ดีที่สุดเท่าที่รู้"
     *
     * `luckBudget` ต้องถูกเซฟคู่กับ `substats` เสมอ เพราะ `trySwapSubstat()` แก้ทั้งสองอย่างพร้อมกัน —
     * ถ้าเซฟแค่ substats แล้ว restore ทีหลัง level จะย้อนกลับได้แต่ budget ไม่ย้อน งบจะเพี้ยนสะสม
     * ทุก sweep ที่ล้มเหลว แล้ว algorithm จะ "ซื้อ" tier ได้ผิดจากความจริง
     */
    private saveBest(): void {
        if (!this.substats) return;
        this.bestSubstats   = this.substats.map(s => this.cloneSubstat(s));
        this.bestLuckBudget = this.luckBudget;
    }

    /** ย้อนกลับไป config ที่ดีที่สุด — คู่ตรงข้ามของ saveBest() ต้องคืนครบทั้งสองอย่างเหมือนกัน */
    private restoreBest(): void {
        if (!this.bestSubstats) return;
        this.substats   = this.bestSubstats.map(s => this.cloneSubstat(s));
        this.luckBudget = this.bestLuckBudget;
    }

    /**
     * บวกค่า stat จริงของ `substats` เข้า `this.stats` — เรียกหลัง `initDefaultStats()` ทุกครั้งที่ reset
     * (echo คือของติดตัว ไม่ใช่ runtime state ที่ initDefaultStats() คืนค่าให้เอง)
     *
     * แต่ละ EchoSubstats.level มี 5 ค่า (1 ต่อรอบ roll ตอนอัพเกรด echo) — บวกค่าจาก SUBSTAT_VALUES
     * ทีละ tier เข้า stat ประเภทเดียวกันจนครบ ผลคือ stat รวมของ substat นั้น
     */
    public applySubstats(): void {
        if (!this.substats) return;

        for (const { type, level, actionType } of this.substats) {
            const values = SUBSTAT_VALUES[type]!;
            for (const tier of level) {
                const value = values[tier - 1];
                if (actionType !== undefined) {
                    this.addStat(type, actionType, value);
                } else {
                    this.addStat(type, value);
                }
            }
        }
    }

    /**
     * เช็คว่ารอบปัจจุบัน (`totalDamageRecord`) ทำดาเมจได้มากกว่า record เดิม (`maxTotalDamageRecord`) ไหม —
     * เรียกท้ายรอบ sim **ก่อน** `rerollSubstats()` เสมอ (เทียบเท่า StarRailSimulator's `changeMaxDamage()`
     * ที่ `StandardReroll()` เรียกเป็นบรรทัดแรกสุด)
     *
     * ถ้ามากกว่า — บันทึกรอบนี้เป็น record ใหม่ทั้งหมด:
     * 1. `maxDmgRecord` ของตัวเอง อิงตาม key ทุกตัวใน `dmgRecord` ของตัวเอง (snapshot ทับของเดิม)
     * 2. `maxTotalDamageRecord` ของตัวเอง = `totalDamageRecord`
     * 3. `maxTotalDamageRecord[allyNum]` ของ enemy **ทุกตัว** ที่ส่งเข้ามา = `totalDamageRecord[allyNum]` ของ enemy ตัวนั้น
     *    (แตะเฉพาะ index ของตัวเอง ไม่ยุ่งกับ ally คนอื่นใน array เดียวกัน)
     * 4. `bestSubstats` = snapshot ของ `substats` ปัจจุบัน (เทียบเท่า `Max_damage_Substats[i] = Substats[i].second`)
     * 5. `rerollImproved = true` — บอก `rerollSubstats()` ว่า sweep ปัจจุบันเจอของดีขึ้นแล้ว ให้ลอง sweep ซ้ำอีกรอบ
     */
    public updateMaxRecords(enemies: EnemyUnit[]): boolean {
        const isNewRecord = this.totalDamageRecord > this.maxTotalDamageRecord;

        if (isNewRecord) {
            for (const [key, value] of this.dmgRecord) {
                this.maxDmgRecord.set(key, value);
            }
            this.maxTotalDamageRecord = this.totalDamageRecord;

            for (const enemy of enemies) {
                enemy.maxTotalDamageRecord[this.allyNum] = enemy.totalDamageRecord[this.allyNum] ?? 0;
            }

            this.saveBest();
            this.rerollImproved = true;
        }

        return isNewRecord;
    }

    /**
     * ทำ substat reroll 1 ก้าว — เรียกท้ายแต่ละรอบ sim **หลัง** `updateMaxRecords()` เสมอ
     * พอร์ตมาจาก StarRailSimulator's `StandardReroll()` (ดู `RelicAdjust.h`) — โครงสร้าง sweep/retry/advance
     * เหมือนต้นฉบับทุกจุด ต่างแค่ "1 point" ของ StarRail (แต้ม quota ธรรมดา) ถูกแทนด้วย "1 tier ของ 1 ช่อง
     * echo" ของ WuWa (เลือกช่องด้วย pickBestTuneUpSlot/pickBestDecreaseSlot แทนการบวก/ลบเลขตรงๆ)
     *
     * แนวคิด: สำหรับ target = substats[rerollSubstatIndex] ตัวปัจจุบัน ไล่ "สไลด์" หา source ทีละตัว
     * **จาก substats[0] ไล่ขึ้นเข้าหา target** — substats[0] → substats[1] → ... →
     * substats[rerollSubstatIndex - 1] (rerollSourceIndex ตามตำแหน่งสไลด์)
     *
     * ทิศทางนี้เลือกไว้เพราะอ่านง่าย (ไล่ขึ้นเป็นทิศที่คนอ่านโค้ดคาดหวังโดยธรรมชาติ) แต่**ไม่ใช่รายละเอียด
     * ที่สลับได้ตามใจ** — ลำดับมีผลต่อผลลัพธ์จริง เพราะแต่ละคอลจบทันทีที่แลกสำเร็จตัวแรก, trade สะสมกัน
     * ภายใน sweep เดียว (ไม่ revert ระหว่างทาง) และ bestSubstats ขยับตามไปด้วย
     * ถ้าจะเปลี่ยนทิศต้องตั้งใจเปลี่ยน และแก้ test `sweeps sources from substats[0] upward toward the target` คู่กัน
     *
     * ลองย้าย 1 tier จาก source ไป target จริง (ไม่ revert เอง) แล้วคืน `true` ให้ caller ไปรัน sim จริง + เรียก
     * `updateMaxRecords()` ก่อนเรียกฟังก์ชันนี้อีกครั้ง — ถ้า source ตัวไหนแลกไม่ได้เลย (pickBestDecreaseSlot
     * คืน null) ข้ามไปตัวถัดไปทันทีในลูปเดียวกัน ไม่เสีย 1 รอบ sim ไปเปล่าๆ
     *
     * เมื่อสไลด์ครบทุก source แล้ว (จบ sweep):
     * - ถ้า `rerollImproved` (updateMaxRecords() เจอ record ใหม่ระหว่าง sweep นี้อย่างน้อย 1 ครั้ง) →
     *   ลอง sweep ใหม่อีกรอบกับ target เดิม (อาจมีอีกหลาย point ที่ควรย้ายเข้า target นี้)
     * - ถ้าไม่เจอเลยทั้ง sweep → เลื่อนไปปั๊ม target ตัวถัดไป
     *
     * ทุกครั้งที่ "เริ่ม sweep ใหม่" (ทั้งขึ้น target ใหม่ และ retry target เดิม) reset `substats` กลับเป็น
     * สำเนาของ `bestSubstats` ก่อนเสมอ — กัน sweep ก่อนหน้าที่ลองแล้วไม่ดีขึ้นทิ้งร่องรอยค้างไว้
     *
     * เลื่อนจนเกิน substats ทั้งหมด → จบการค้นหา, คืน `substats` กลับเป็นเวอร์ชันดีที่สุด (`bestSubstats`)
     * เผื่อ sweep สุดท้ายเดินเลย best ไปแล้วโดยไม่เจอของที่ดีกว่า, คืน `false`
     */
    public rerollSubstats(): boolean {
        if (!this.substats) return false;

        while (true) {
            if (this.rerollSubstatIndex > this.substats.length - 1) {
                this.restoreBest();
                return false;
            }

            if (this.rerollSourceIndex === -1) {
                this.restoreBest();

                // sweep เริ่มที่ substats[0] เสมอ แล้วไล่ขึ้นเข้าหา target
                if (this.trySwapSubstat(0)) {
                    this.rerollSourceIndex = 0;
                    return true;
                }

                this.rerollSourceIndex = 0;
                continue;
            }

            // ตัวถัดไปจะชน target แล้ว (แลกกับตัวเองไม่ได้) = สไลด์ครบทุก source แล้ว
            if (this.rerollSourceIndex + 1 >= this.rerollSubstatIndex) {
                if (this.rerollImproved) {
                    this.rerollImproved = false;
                    this.rerollSourceIndex = -1;
                    continue;
                }

                this.rerollSubstatIndex++;
                this.rerollSourceIndex = -1;
                continue;
            }

            const nextSource = this.rerollSourceIndex + 1;
            if (this.trySwapSubstat(nextSource)) {
                this.rerollSourceIndex = nextSource;
                return true;
            }
            this.rerollSourceIndex = nextSource;
        }
    }

    /**
     * ลองย้าย 1 tier จาก substats[sourceIndex] ไปยัง substats[rerollSubstatIndex] จริง (ไม่ revert เอง)
     * คืน false เฉยๆ ถ้า source ตัวนี้ไม่มีช่องให้ลด (pickBestDecreaseSlot คืน null) — ไม่แตะ state อะไรเลย
     */
    private trySwapSubstat(sourceIndex: number): boolean {
        const target = this.substats![this.rerollSubstatIndex];
        const targetTableKey = getTableKeyForStat(target.type);
        const { index: n, chance: threshold } = pickBestTuneUpSlot(targetTableKey, target.level);

        const source = this.substats![sourceIndex];
        const sourceTableKey = getTableKeyForStat(source.type);
        const m = pickBestDecreaseSlot(sourceTableKey, source.level, threshold);

        if (m === null) return false;

        target.level[n] += 1;
        source.level[m] -= 1;

        // ซื้อ (target ได้ point เพิ่ม) = หาร luckBudget ด้วย chance ที่ใช้ซื้อ (threshold ก่อนบวก)
        // ขาย (source เสีย point) = คูณ luckBudget กลับด้วย chance ของ tier ที่เหลือหลังลด
        const sellChance = getTuneUpChance(sourceTableKey, source.level[m]) / 100;
        this.luckBudget = (this.luckBudget / threshold) * sellChance;

        return true;
    }

}