import { ActionType, ElementType, MultiplierType } from "../../Constants/Enum";
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

    /**
     * target รับได้ทั้ง unit เดียวและหลาย unit
     * ถ้าอยากยิงตาม SkillRange ให้กรองจาก battleField ก่อนแล้วค่อยส่งเข้ามา:
     *   new Damage(unit, "BA1", ActionType.BA, timeline.battleField.enemiesInRange(SkillRange.Contact))
     */
    constructor(
        attacker   : AllyUnit,
        name       : string,
        attackType : ActionType | ActionType[],
        target     : EnemyUnit | EnemyUnit[],
        energyGain?: number,
        concentoEnergyGain?: number
    ) {
        this.attacker       = attacker;
        this.name           = name;
        this.element        = attacker.elementType;
        this.attackTypeList = Array.isArray(attackType) ? attackType : [attackType];
        this.energyGain         = energyGain;
        this.concentoEnergyGain = concentoEnergyGain;

        this.targets = Array.isArray(target) ? target : [target];
    }
}
