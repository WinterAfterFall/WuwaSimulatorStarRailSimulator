import { Unit } from "./Unit";
import { EnemyPosition, StatsType } from "../Constants/Enum";

export class EnemyUnit extends Unit {

    public level      : number = 90;

    // --- Position ---
    public position: EnemyPosition = EnemyPosition.Vanguard;

    // --- Debuff Tracking ---
    public debuffStacks : Map<string, number>  = new Map();
    public debuffNote   : Map<string, number>  = new Map();
    public debuffCheck  : Map<string, boolean> = new Map();

    // --- Damage Record ---
    public dmgRecord    : Map<string, number> = new Map();
    public maxDmgRecord : Map<string, number> = new Map();

    constructor(name: string) {
        super(name);
        // ค่าต้านทานธาตุพื้นฐานของ enemy ทุกตัว = 10% (ก่อนหัก ResRed/ResPen)
        this.setDefaultStat(StatsType.Res, 10);
        this.initDefaultStats();
    }
}
