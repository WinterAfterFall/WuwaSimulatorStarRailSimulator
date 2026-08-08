import { CombatEvent } from "./CombatEvent";

/**
 * GlobalLockChange — event ที่มีหน้าที่เดียว: เปลี่ยนค่า `isGlobalLocked` ของสนามรบ
 *
 *   value = 1 → ล็อก   (Director ดึง action ใหม่ไม่ได้)
 *   value = 0 → ปลดล็อก
 *
 * เหตุผลที่แยกเป็น event ของตัวเอง แทนที่จะให้ ActionEvent ไปกดค่าเองผ่าน `isManual`:
 * "ช่วงเวลาที่ถูกล็อก" กลายเป็นของที่ **มองเห็นในคิว** ไม่ใช่ผลข้างเคียงที่ต้องรันในหัวถึงจะรู้
 * และ `scheduleStartCombo()` เป็นคนออก event คู่ (on/off) พร้อมกันเสมอ จึงไม่มีทางล็อกแล้วลืมปลด
 *
 * เทียบ C++: ต่างกันแบบ `mtx.lock()` ที่โปรยไว้แล้วหวังว่าจะมีใครเรียก `unlock()`
 * กับ `std::lock_guard` ที่การปลดถูกผูกมากับตัวกลไกเอง ไม่ใช่วินัยของคนเขียน
 *
 * ⚠️ คลาสนี้ **ไม่มี** overload (name, time) / (name, time, priority) เหมือน event ตัวอื่น
 * เพราะ `resolveTimePriority()` แยก time/priority ออกจาก payload ด้วย `typeof === "number"`
 * แต่ payload ของ event นี้เป็นตัวเลข (1/0) เสียเอง — ส่ง `new GlobalLockChange("x", 1)`
 * เข้าไปจะถูกอ่านเป็น "time = 1" ทันที จึงตัด overload ทิ้งทั้งชุดเพื่อไม่ให้มีทางเข้าใจผิด
 * (ตั้งเวลาผ่าน `field.schedule(event, offset)` ได้อยู่แล้ว ซึ่งเป็นทางปกติของทุก event)
 */
export class GlobalLockChange extends CombatEvent {
    /**
     * priority ตายตัวตามค่า value — คนเรียกไม่ต้องตั้งเอง และตั้งผิดไม่ได้
     *
     * **ล็อกก่อนใครเสมอ ปลดหลังใครเสมอ** ในเฟรมเดียวกัน (IPQ เรียง priority น้อยออกก่อน)
     * ถ้าปล่อยให้เท่ากับ event อื่น (0 เท่ากันหมด) ลำดับ pop จะขึ้นกับรูปร่าง heap ล้วนๆ —
     * กรณีที่พังจริงคือ event ตัวหลักออกก่อน lock-on แล้ว do-while ของ RotationDirector
     * เห็น `isGlobalLocked` ยังเป็น false เลยหลุดออกไปดึง action ถัดไปทั้งที่คอมโบเพิ่งเริ่ม
     */
    private static readonly PRIORITY_LOCK_ON  = -1;
    private static readonly PRIORITY_LOCK_OFF =  1;

    /** ค่าที่จะเซ็ตให้ isGlobalLocked — 1 = ล็อก, 0 = ปลด */
    public readonly value: 1 | 0;

    constructor(name: string, value: 1 | 0) {
        super(name, 0, value === 1 ? GlobalLockChange.PRIORITY_LOCK_ON : GlobalLockChange.PRIORITY_LOCK_OFF);
        this.value = value;

        this.execute = (battleField) => {
            battleField.isGlobalLocked = this.value === 1;
        };
    }
}
