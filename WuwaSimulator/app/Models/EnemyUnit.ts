import { Unit } from "./Unit";
import { EnemyPosition, StatsType } from "../Constants/Enum";

export class EnemyUnit extends Unit {

    public level      : number = 90;

    // --- Position ---
    public position: EnemyPosition = EnemyPosition.Vanguard;

    // --- Roster Position ---
    public enemyNum: number = 0; // ลำดับของ enemy ตัวนี้ในสนาม (index ใน battleField.enemies) — ตั้งให้ตอน BattleField.createEnemy()

    // --- Debuff Tracking ---
    public debuffStacks : Map<string, number>  = new Map();
    public debuffNote   : Map<string, number>  = new Map();
    public debuffCheck  : Map<string, boolean> = new Map();

    // --- Damage Record (แยกตาม index ของ ally ที่ตี — เก็บเป็น list เพราะ enemy โดนดาเมจจากหลาย ally พร้อมกันได้) ---
    /** totalDamageRecord[allyNum] = ผลรวมดาเมจที่ ally คนนั้นตีเข้า enemy ตัวนี้ในรอบปัจจุบัน */
    public totalDamageRecord    : number[] = [];
    /** totalDamageRecord[allyNum] ของรอบที่ ally คนนั้นทำดาเมจได้มากที่สุดเท่าที่เคยมี — อัพเดตผ่าน AllyUnit.updateMaxRecords() เท่านั้น */
    public maxTotalDamageRecord : number[] = [];

    constructor(name: string) {
        super(name);
        // ค่าต้านทานธาตุพื้นฐานของ enemy ทุกตัว = 10% (ก่อนหัก ResRed/ResPen)
        this.setDefaultStat(StatsType.Res, 10);
        this.initDefaultStats();
    }
}
