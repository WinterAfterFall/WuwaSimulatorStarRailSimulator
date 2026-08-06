import { ActionEvent } from "./ActionEvent";

/**
 * AttackActionEvent — action โจมตี
 * ใช้เช็ค "เมื่อมีการ action โจมตี" ด้วย instanceof AttackActionEvent
 *
 * ไม่มี field/constructor เพิ่มของตัวเอง — inherit constructor ของ ActionEvent ตรงๆ (รวม 3 overload
 * name / name+time / name+time+priority ก่อน unit, actionType, isManual?, onExecute? ด้วย)
 * ส่ง duration/autoStartFrame เข้า timeline.scheduleStartCombo(event, duration?, autoStartFrame?) ตอน schedule แทน
 */
export class AttackActionEvent extends ActionEvent {
}
