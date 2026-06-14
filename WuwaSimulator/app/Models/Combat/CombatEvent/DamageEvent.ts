import { AllyUnit } from "../../AllyUnit";
import { Damage } from "../Damage";
import { CombatEvent } from "./CombatEvent";

/**
 * DamageEvent — ความเสียหายที่จะเกิดขึ้น ณ frame นั้น
 * เมื่อ execute จะเรียก DamageCalculate และบันทึกผลลัพธ์
 */
export class DamageEvent extends CombatEvent {
    public readonly damage: Damage;
    public readonly target: AllyUnit;

    constructor(
        name: string,
        time: number,
        damage: Damage,
        target: AllyUnit,
        priority: number = 0
    ) {
        super(name, time, 0, priority);
        this.damage = damage;
        this.target = target;
    }

    public execute(): void {
        // TODO: เรียก DamageCalculate แล้วบันทึกผลลงใน attacker.dmgRecord
    }
}
