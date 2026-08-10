import { ActionType } from "../../../Constants/Enum";
import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * ActionEvent — base class ของทุก action ที่ตัวละครทำ
 * ใช้เช็ค "เมื่อมีการ action" ได้ด้วย instanceof ActionEvent
 *
 * execute เริ่มต้น (ใช้ร่วมกันทุก subclass): check ว่า manual action มาจากตัวที่อยู่บนสนามจริง
 * แล้ว setBusy เท่านั้น — **ไม่มี onExecute แล้ว**
 *
 * ผลข้างเคียงเฉพาะท่า (log, บวก stack, ติดบัพ) ให้ต่อผ่าน `BattleField.appendOnExecute(event, fn)`
 * ซึ่งห่อ `execute` ให้ ใช้ได้กับ event ทุกชนิดไม่ใช่แค่ ActionEvent และไม่ต้องแยก arg ด้วย typeof
 * ตอน runtime แบบเดิม (ที่ทำให้ overload ประกาศไม่ตรงกับของที่ implementation รับจริง)
 *
 * duration/autoStartFrame ไม่ใช่ field ของ event นี้ — มันไม่ใช่ "ข้อมูลของ action" จริงๆ
 * แค่ค่าที่ใช้ครั้งเดียวตอน schedule จึงเป็น parameter ของ `scheduleStartOnFieldAction()` แทน
 *
 * constructor เดียว — public, ไม่มี static factory .manual()/.auto() แยก เพราะความต่างเดียว
 * ระหว่างสองแบบคือ isManual (optional, default true) ล้วนๆ — AttackActionEvent/BuffActionEvent
 * ไม่มี field เพิ่มของตัวเอง เลย inherit constructor นี้ตรงๆ ไม่ต้องเขียนซ้ำ
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — unit/actionType/isManual
 * เลื่อนตามหลัง time/priority เสมอ (ดู resolveTimePriority ที่แยก args ให้)
 */
export abstract class ActionEvent extends CombatEvent {
    /** unit ที่ทำ action นี้ */
    public readonly unit: AllyUnit;

    /** ประเภทของ action */
    public readonly actionType: ActionType;

    /**
     * action นี้เริ่มต้นเป็น manual หรือไม่
     * true  → GlobalLock ON เมื่อ execute (default)
     * false → UnitLock เท่านั้น
     */
    public readonly isManual: boolean;

    constructor(name: string, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, time: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, time: number, priority: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit, actionType, isManual = true] = rest as [AllyUnit, ActionType, boolean?];

        super(name, time, priority);
        this.unit       = unit;
        this.actionType = actionType;
        this.isManual   = isManual;

        this.execute = (battleField) => {
            // ─── check ─────────────────────────────────────────────────────
            // manual action = ผู้เล่นกดเอง จึงทำได้เฉพาะตัวที่ยืนอยู่บนสนามตอนนั้นเท่านั้น
            // ถ้าไม่ตรงแปลว่า rotation สั่งท่าให้ตัวที่ยังไม่ได้ swap เข้ามา (หรือลืมสั่ง swap)
            //
            // ให้ดังตรงนี้เลย เพราะถ้าปล่อยผ่าน ผลจะไปโผล่เป็นดาเมจของตัวที่ไม่ได้อยู่ในสนาม
            // ปนอยู่ในสรุป DPS โดยไม่มีอะไรฟ้อง — ผิดแบบเงียบที่สุดที่จะเป็นไปได้
            //
            // action ที่ไม่ใช่ manual (ท่าที่ต่อเนื่องมาเองกลางคอมโบ) ไม่ต้องเช็ค เพราะมันเกิด
            // หลังตัวละครสลับออกไปแล้วได้ตามปกติ
            if (this.isManual && battleField.onFieldChar !== this.unit) {
                throw new Error(
                    `${this.name}: "${this.unit.name}" สั่ง manual action ทั้งที่ไม่ได้อยู่บนสนาม ` +
                    `(onFieldChar = ${battleField.onFieldChar?.name ?? "ไม่มี"})`
                );
            }

            this.unit.setBusy();
        };
    }
}
