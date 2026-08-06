import { MultiplierType } from "../../Constants/Enum";

/**
 * MoveData — รวมค่าที่ใช้ประกอบ 1 ท่า (BA/Skill/Ult ฯลฯ) ไว้ในตัวแปรเดียว
 * แทนที่การประกาศ const แยกกันหลายตัวต่อท่า (เช่น BA1_DURATION, BA1_DAMAGE_FRAME, BA1_DMG ใน Mornye.ts)
 */
export interface MoveData {
    duration      : number;          // frame ที่ท่านี้ใช้ทั้งหมด — ใส่ตรงเข้า AttackActionEvent(duration)
    damageFrame   : number;          // frame ที่ดาเมจเกิดจริง นับจากเริ่มท่า — บวกเข้า t ตอน schedule DamageEvent
    energyGain?   : number;          // energy ที่ได้จากท่านี้ — ไม่ใส่ = ท่านี้ไม่ให้ energy
    concento?     : number;          // concento energy ที่ได้จากท่านี้ — ไม่ใส่ = ท่านี้ไม่ให้ concento
    mtpr          : number;          // ตัวคูณสกิล (%) — หน่วยเดียวกับ DMG consts เดิม (หาร 100 ตอน setMultipliers)
    type          : MultiplierType;  // สเกลจากสเตตัสไหน — Atk / Hp / Def / Const
    autoStartFrame?: number;         // frame ที่เปลี่ยนเป็น auto นับจากเริ่มท่า — ไม่ใส่ = ท่านี้ไม่มี auto transition (ส่งต่อเข้า timeline.scheduleStartCombo() เพื่อ schedule ChangeToAuto)
}
