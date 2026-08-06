import { ActionEvent } from "./ActionEvent";

/**
 * BuffActionEvent — action buff skill
 * ใช้เช็ค "เมื่อมีการ action buff" ด้วย instanceof BuffActionEvent
 *
 * ไม่มี field/constructor เพิ่มของตัวเอง — inherit constructor ของ ActionEvent ตรงๆ (รวม 3 overload
 * name / name+time / name+time+priority ก่อน unit, actionType, isManual?, onExecute? ด้วย)
 * ส่ง duration/autoStartFrame เข้า timeline.scheduleStartCombo(event, duration?, autoStartFrame?) ตอน schedule แทน
 */
export class BuffActionEvent extends ActionEvent {
}
