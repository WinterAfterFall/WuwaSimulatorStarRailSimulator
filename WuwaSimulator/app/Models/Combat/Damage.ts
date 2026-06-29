import { ActionType, ElementType, SkillRange, MultiplierType } from "../../Constants/Enum";
import { AllyUnit } from "../AllyUnit";
import { EnemyUnit } from "../EnemyUnit";

type SkillScaling = Record<MultiplierType, number>;

export class Damage {
    public name          : string;
    public attacker      : AllyUnit;
    public element       : ElementType;
    public attackTypeList: ActionType[];
    public isCritable    : boolean = true;
    public targets       : EnemyUnit[];
    public gauges        : [string, number][] = [];
    public energyGain        ?: number;
    public concentoEnergyGain?: number;
    public multipliers: SkillScaling = {
        [MultiplierType.Atk]:   0,
        [MultiplierType.Hp]:    0,
        [MultiplierType.Def]:   0,
        [MultiplierType.Const]: 0,
    };

    // --- Overload: ใส่ครบ 4 ค่าพร้อมกัน ---
    public setMultipliers(atk: number, hp: number, def: number, const_: number): this;
    // --- Overload: ใส่เป็นคู่ [key, value] ---
    public setMultipliers(...pairs: [MultiplierType, number][]): this;
    public setMultipliers(...args: any[]): this {
        if (typeof args[0] === "number") {
            this.multipliers[MultiplierType.Atk]   = args[0];
            this.multipliers[MultiplierType.Hp]    = args[1];
            this.multipliers[MultiplierType.Def]   = args[2];
            this.multipliers[MultiplierType.Const] = args[3];
        } else {
            for (const [type, value] of args as [MultiplierType, number][]) {
                this.multipliers[type] = value;
            }
        }
        return this;
    }

    // --- Overload: บวกเพิ่มครบ 4 ค่าพร้อมกัน ---
    public addMultipliers(atk: number, hp: number, def: number, const_: number): this;
    // --- Overload: บวกเพิ่มเป็นคู่ [key, value] ---
    public addMultipliers(...pairs: [MultiplierType, number][]): this;
    public addMultipliers(...args: any[]): this {
        if (typeof args[0] === "number") {
            this.multipliers[MultiplierType.Atk]   += args[0];
            this.multipliers[MultiplierType.Hp]    += args[1];
            this.multipliers[MultiplierType.Def]   += args[2];
            this.multipliers[MultiplierType.Const] += args[3];
        } else {
            for (const [type, value] of args as [MultiplierType, number][]) {
                this.multipliers[type] += value;
            }
        }
        return this;
    }

    public multiplyMultipliers(scalar: number): this;
    public multiplyMultipliers(atk: number, hp: number, def: number, const_: number): this;
    public multiplyMultipliers(...pairs: [MultiplierType, number][]): this;
    public multiplyMultipliers(...args: any[]): this {
        if (Array.isArray(args[0])) {
            for (const [type, value] of args as [MultiplierType, number][]) {
                this.multipliers[type] *= value;
            }
        } else if (args.length === 1) {
            const scalar = args[0] as number;
            for (const key of Object.values(MultiplierType)) {
                this.multipliers[key] *= scalar;
            }
        } else {
            this.multipliers[MultiplierType.Atk]   *= args[0];
            this.multipliers[MultiplierType.Hp]    *= args[1];
            this.multipliers[MultiplierType.Def]   *= args[2];
            this.multipliers[MultiplierType.Const] *= args[3];
        }
        return this;
    }

    public setEnergyGain(value: number): this {
        this.energyGain = value;
        return this;
    }

    public setConcentoEnergyGain(value: number): this {
        this.concentoEnergyGain = value;
        return this;
    }

    public getEnergyGain(): number | undefined {
        return this.energyGain;
    }

    public getConcentoEnergyGain(): number | undefined {
        return this.concentoEnergyGain;
    }

    public addGauges(...pairs: [string, number][]): this {
        for (const pair of pairs) {
            this.gauges.push(pair);
        }
        return this;
    }

    // --- Overload 1: target เจาะจง (unit เดียวหรือหลาย unit) ---
    constructor(
        attacker   : AllyUnit,
        name       : string,
        attackType : ActionType | ActionType[],
        target     : EnemyUnit | EnemyUnit[],
        energyGain?: number,
        concentoEnergyGain?: number
    );

    // --- Overload 2: SkillRange — วนหาเป้าจาก enemies list ตาม position ---
    constructor(
        attacker   : AllyUnit,
        name       : string,
        attackType : ActionType | ActionType[],
        range      : SkillRange,
        enemies    : EnemyUnit[],
        energyGain?: number,
        concentoEnergyGain?: number
    );

    constructor(
        attacker      : AllyUnit,
        name          : string,
        attackType    : ActionType | ActionType[],
        targetOrRange : EnemyUnit | EnemyUnit[] | SkillRange,
        enemiesOrEnergy      ?: EnemyUnit[] | number,
        energyOrConcento     ?: number,
        concentoEnergyGain   ?: number
    ) {
        this.attacker      = attacker;
        this.name          = name;
        this.element       = attacker.elementType;
        this.attackTypeList = Array.isArray(attackType) ? attackType : [attackType];

        if (typeof targetOrRange === "string") {
            // SkillRange path — กรอง enemies ที่ position < range
            const enemies = enemiesOrEnergy as EnemyUnit[];
            this.targets           = enemies.filter(e => Number(e.position) < Number(targetOrRange));
            this.energyGain        = energyOrConcento;
            this.concentoEnergyGain = concentoEnergyGain;
        } else if (Array.isArray(targetOrRange)) {
            // EnemyUnit[] path
            this.targets            = targetOrRange;
            this.energyGain         = enemiesOrEnergy as number | undefined;
            this.concentoEnergyGain = energyOrConcento;
        } else {
            // Single EnemyUnit path
            this.targets            = [targetOrRange];
            this.energyGain         = enemiesOrEnergy as number | undefined;
            this.concentoEnergyGain = energyOrConcento;
        }
    }
}
