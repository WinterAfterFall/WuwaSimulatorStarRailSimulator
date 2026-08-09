import { ActionType } from "../../../Constants/Enum";
import { AllyUnit } from "../../AllyUnit";
import { CombatEvent } from "./CombatEvent";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * ActionEvent — base class ของทุก action ที่ตัวละครทำ
 * ใช้เช็ค "เมื่อมีการ action" ได้ด้วย instanceof ActionEvent
 *
 * execute เริ่มต้น (ใช้ร่วมกันทุก subclass): setBusy → onExecute?.() เท่านั้น
 *
 * duration/autoStartFrame ไม่ใช่ field ของ event นี้แล้ว — มันไม่ใช่ "ข้อมูลของ action"
 * จริงๆ แค่ค่าที่ใช้ครั้งเดียวตอน schedule เพื่อบอกว่าจะ auto-schedule EndAction/ChangeToAuto
 * ตามมาไหม จึงย้ายไปเป็น parameter ของ CombatTimeline.scheduleStartCombo() แทน (ดูที่นั่น)
 *
 * constructor เดียว — public, ไม่ต้องมี static factory .manual()/.auto() แยกแล้ว เพราะความต่างเดียว
 * ระหว่างสองแบบคือ isManual (optional, default true) ล้วนๆ — AttackActionEvent/BuffActionEvent
 * ไม่มี field เพิ่มของตัวเอง เลย inherit constructor นี้ตรงๆ ไม่ต้องเขียนซ้ำ
 *
 * รองรับ 3 รูปแบบเหมือน CombatEvent (name / name+time / name+time+priority) — unit/actionType/isManual/onExecute
 * เลื่อนตามหลัง time/priority เสมอ (ดู resolveTimePriority ที่แยก args ให้) — isManual/onExecute เองก็แยกด้วย
 * typeof (boolean vs function) เลยส่งแค่ onExecute เดี่ยวๆ แบบเดิม (ไม่มี isManual) ก็ยังใช้ได้
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

    constructor(name: string, unit: AllyUnit, actionType: ActionType, isManual?: boolean, onExecute?: () => void);
    constructor(name: string, time: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean, onExecute?: () => void);
    constructor(name: string, time: number, priority: number, unit: AllyUnit, actionType: ActionType, isManual?: boolean, onExecute?: () => void);
    constructor(name: string, ...args: unknown[]) {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit, actionType, ...tail] = rest as [AllyUnit, ActionType, ...unknown[]];

        // isManual/onExecute แยกด้วย typeof เหมือนกับ time/priority — boolean กับ function ไม่มีทางชนกัน
        // จึงรับได้ทั้งสองแบบไม่ว่าจะส่งมาตามลำดับ (isManual, onExecute) ใหม่ หรือแบบเดิม (onExecute) เดี่ยวๆ
        let isManual = true;
        let onExecute: (() => void) | undefined;
        for (const value of tail) {
            if (typeof value === "boolean") isManual = value;
            else if (typeof value === "function") onExecute = value as () => void;
        }

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
            onExecute?.();
        };
    }
}
