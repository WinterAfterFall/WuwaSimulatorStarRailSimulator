import { AllyUnit } from "../../AllyUnit";
import { Damage } from "../Damage";
import { CombatEvent } from "./CombatEvent";
import { calculateDamage } from "../../../Services/Damage/DamageCalculate";
import type { TriggerBus } from "../../../Simulator/TriggerBus";

/**
 * DamageEvent — ความเสียหายที่จะเกิดขึ้น ณ frame นั้น
 * เมื่อ execute จะเรียก DamageCalculate (ถ้ามี triggerBus ส่งมา) แล้ว calculateDamage จะ print เองว่าตีโดนใคร/ดาเมจเท่าไหร่
 */
export class DamageEvent extends CombatEvent {
    public readonly damage: Damage;
    public readonly target: AllyUnit;

    constructor(
        name: string,
        time: number,
        damage: Damage,
        target: AllyUnit,
        priority: number = 0,
        onExecute?: () => void,
        triggerBus?: TriggerBus
    ) {
        super(name, time, 0, priority);
        this.damage = damage;
        this.target = target;

        this.execute = () => {
            if (triggerBus) {
                calculateDamage(this.damage, triggerBus);
            }
            onExecute?.();
        };
    }
}
