import { AllyUnit } from "../../AllyUnit";
import { Damage } from "../Damage";
import { CombatEvent } from "./CombatEvent";
import { calculateDamage } from "../../../Services/Damage/DamageCalculate";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * DamageEvent — ความเสียหายที่จะเกิดขึ้น ณ frame นั้น
 *
 * execute แบ่งเป็น 2 จังหวะ: `calculateDamage` คำนวณ+print ดาเมจ (สูตรล้วน ไม่แตะ state ใคร)
 * แล้ว `battleField.applyResourceGain` จ่าย energy/concento/gauge ให้ผู้ตี
 *
 * ไม่ต้องแนบ triggerBus มาตอนสร้างอีกแล้ว — battleField ส่งตัวเองเข้ามาตอน execute
 * (เดิมถ้าลืมส่งจะ no-op เงียบๆ ไม่มี error ให้เห็นเลย)
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — damage/target/onExecute
 * เลื่อนตามหลัง time/priority เสมอ
 */
export class DamageEvent extends CombatEvent {
    public readonly damage: Damage;
    public readonly target: AllyUnit;

    constructor(name: string, damage: Damage, target: AllyUnit, onExecute?: () => void);
    constructor(name: string, time: number, damage: Damage, target: AllyUnit, onExecute?: () => void);
    constructor(name: string, time: number, priority: number, damage: Damage, target: AllyUnit, onExecute?: () => void);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [damage, target, onExecute] = rest as [Damage, AllyUnit, (() => void) | undefined];

        super(name, time, priority);
        this.damage = damage;
        this.target = target;

        this.execute = (battleField) => {
            calculateDamage(this.damage);
            battleField.applyResourceGain(this.damage);
            onExecute?.();
        };
    }
}
