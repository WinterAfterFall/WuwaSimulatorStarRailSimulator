import { CombatEvent } from "./CombatEvent";
import { AllyUnit } from "../../AllyUnit";
import { TriggerEvent } from "../../../Constants/Enum";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * CastUltimateEvent — event ตอนเริ่มร่าย Ultimate
 *
 * แยกจาก action/ดาเมจจริงของ Ult เพราะในเกมสองจังหวะนี้ทำงานคนละจุดกัน — เริ่มร่ายก่อน
 * ร่ายจบค่อยเกิด action จริง execute ของ event นี้ทำ 4 อย่างตามลำดับ:
 *   1) เช็คว่า energy พอ ult cost ไหม — ไม่พอ throw ทันที (ห้าม pass ผ่านเงียบๆ)
 *   2) หัก energy ลงตาม ultCost — คอมมิตการใช้พลังงานทันทีที่เริ่มร่าย
 *   3) emit TriggerEvent.UltimateCast ให้ passive ตัวอื่นรู้ว่า unit นี้กด Ult
 *   4) เรียก unit.ultimate?.(battleField) — action จริงของ Ult ซึ่งแต่ละตัวละครไม่เหมือนกัน
 *      (field ว่าง/undefined by default บน AllyUnit — ตัวละครที่มี Ult ต้อง set เอง)
 */
export class CastUltimateEvent extends CombatEvent {
    /** ตัวละครที่กำลังร่าย Ult */
    public readonly unit: AllyUnit;

    constructor(name: string, unit: AllyUnit);
    constructor(name: string, time: number, unit: AllyUnit);
    constructor(name: string, time: number, priority: number, unit: AllyUnit);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit] = rest as [AllyUnit];

        super(name, time, priority);
        this.unit = unit;

        this.execute = (battleField) => {
            if (this.unit.energy < this.unit.ultCost) {
                throw new Error(
                    `${this.name}: "${this.unit.name}" พลังงานไม่พอกด Ultimate ` +
                    `(energy = ${this.unit.energy}/${this.unit.ultCost})`
                );
            }

            this.unit.energy -= this.unit.ultCost;

            battleField.triggerBus.emit(TriggerEvent.UltimateCast, { unit: this.unit });
            this.unit.ultimate?.(battleField);
        };
    }
}
