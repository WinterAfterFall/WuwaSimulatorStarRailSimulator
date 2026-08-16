import { Unit } from "./Unit";
import { StatsType, ActionType, ElementType, WeaponType, ActionState } from "../Constants/Enum";
import { Queue } from "../Utils/queue";
import { RotationAction } from "./Combat/RotationAction";
import type { BattleField } from "../Simulator/BattleField";
import type { EchoSubstats } from "../extra/substats/EchoSubstats";

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
     * ทุก entry เริ่ม level ที่ [1]
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

        this.substats     = statsTypes.map(({ type, actionType }) => ({ type, level: [1], actionType }));
        this.bestSubstats = statsTypes.map(({ type, actionType }) => ({ type, level: [1], actionType }));

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
    }

}