import { AllyUnit } from "../../AllyUnit";
import { Damage } from "../Damage";
import { CombatEvent } from "./CombatEvent";
import { calculateDamage } from "../../../Services/Damage/DamageCalculate";
import { resolveTimePriority } from "./resolveTimePriority";
import type { TriggerBus } from "../../../Simulator/TriggerBus";

/**
 * DamageEvent — ความเสียหายที่จะเกิดขึ้น ณ frame นั้น
 * เมื่อ execute จะเรียก DamageCalculate (ถ้ามี triggerBus ส่งมา) แล้ว calculateDamage จะ print เองว่าตีโดนใคร/ดาเมจเท่าไหร่
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — damage/target/onExecute/triggerBus
 * เลื่อนตามหลัง time/priority เสมอ
 */
export class DamageEvent extends CombatEvent {
    public readonly damage: Damage;
    public readonly target: AllyUnit;

    constructor(name: string, damage: Damage, target: AllyUnit, onExecute?: () => void, triggerBus?: TriggerBus);
    constructor(name: string, time: number, damage: Damage, target: AllyUnit, onExecute?: () => void, triggerBus?: TriggerBus);
    constructor(name: string, time: number, priority: number, damage: Damage, target: AllyUnit, onExecute?: () => void, triggerBus?: TriggerBus);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [damage, target, onExecute, triggerBus] = rest as [Damage, AllyUnit, (() => void) | undefined, TriggerBus | undefined];

        super(name, time, priority);
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
