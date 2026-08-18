import { Unit } from "./Unit";
import { StatsType, ActionType, ElementType, WeaponType, ActionState } from "../Constants/Enum";
import { Queue } from "../Utils/queue";
import { RotationAction } from "./Combat/RotationAction";
import type { BattleField } from "../Simulator/BattleField";
import { EchoSubstats } from "../extra/substats/EchoSubstats";
import { SUBSTAT_VALUES } from "../extra/substats/SubstatValueData";
import { getTableKeyForStat } from "../extra/substats/SubstatData";
import { getTuneUpChance } from "../extra/substats/SubstatProbability";

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

    // --- Damage Record ---
    public dmgRecord    : Map<string, number> = new Map();
    public maxDmgRecord : Map<string, number> = new Map();

    // --- Echo Substats ---
    public substats?: EchoSubstats[];
    public bestSubstats?: EchoSubstats[];
    public luckBudget: number = 0; // ค่า prob ขั้นต่ำที่ยอมรับได้ (ระดับดวง) — budget เริ่มต้นของ algorithm เช็คว่ารับ substat level ไหนเพิ่มได้ไหม

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

}