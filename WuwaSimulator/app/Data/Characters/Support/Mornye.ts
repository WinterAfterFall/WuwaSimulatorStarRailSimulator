import { AllyUnit } from "../../../Models/AllyUnit";
import { RotationBuilder } from "../../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType, SkillRange, MultiplierType } from "../../../Constants/Enum";
import { AttackActionEvent } from "../../../Models/Combat/CombatEvent/AttackActionEvent";
import { DamageEvent } from "../../../Models/Combat/CombatEvent/DamageEvent";
import { Damage } from "../../../Models/Combat/Damage";
import { MoveData } from "../../../Models/Combat/MoveData";
import type { BattleField } from "../../../Simulator/BattleField";
import type { RotationAction } from "../../../Models/Combat/RotationAction";
import type { Queue } from "../../../Utils/queue";

// ประกาศค่าท่าแบบ MoveData ตัวเดียวต่อท่า (duration/damageFrame/mtpr/type รวมกัน แทนการแยก const 3 ตัวต่อท่าแบบเดิม)
const BA1: MoveData = { duration: 25, damageFrame: 15, mtpr: 22.27 + 16.71 * 2, type: MultiplierType.Atk };
const BA2: MoveData = { duration: 55, damageFrame: 15, mtpr: 23.86 + 23.86 + 17.90 * 4, type: MultiplierType.Atk };
const BA3: MoveData = { duration: 53, damageFrame: 25, mtpr: 41.36 + 10.34 * 6, type: MultiplierType.Atk };

const EBA1: MoveData = { duration: 21, damageFrame: 10, mtpr: 0, type: MultiplierType.Atk }; // mtpr ยังไม่มีข้อมูลจริง — placeholder
const EBA2: MoveData = { duration: 62, damageFrame: 10, mtpr: 0, type: MultiplierType.Atk };
const EBA3: MoveData = { duration: 32, damageFrame: 10, mtpr: 0, type: MultiplierType.Atk };

const ESkill: MoveData = { duration: 76, damageFrame: 53, mtpr: 0, type: MultiplierType.Atk };

const HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME: MoveData = { duration: 85, damageFrame: 25, mtpr: 0, type: MultiplierType.Atk };
const HA_INVERSION_DAMAGE_FRAME: MoveData = { duration: 107, damageFrame: 84, mtpr: 0, type: MultiplierType.Atk }; //88

const Intro: MoveData = { duration: 101, damageFrame: 41, mtpr: 0, type: MultiplierType.Atk };
const Ult: MoveData = { duration: 0, damageFrame: 0, mtpr: 0, type: MultiplierType.Atk };

/**
 * 1 ท่าใน rotation — ชื่อ, ประเภท action, ค่าท่า, ระยะ (ไม่ใส่ = Contact)
 * เป็น tuple ไม่ใช่ object เพราะเขียนเรียงกันหลายบรรทัดแล้วอ่านเป็นตารางได้เลย
 */
type Step = [name: string, actionType: ActionType, move: MoveData, range?: SkillRange];

/**
 * สร้าง rotation factory จากรายการท่า — คืน RotationAction **ตัวเดียว** ที่กางทุกท่าลง IPQ รวดเดียว
 *
 * ทั้งคอมโบถือเป็น "1 input ที่ commit แล้ว" — ผู้เล่นกดปุ่มเริ่มคอมโบครั้งเดียวแล้วท่าที่เหลือ
 * ต่อกันเองตามจังหวะตายตัว จึงคำนวณเวลาของทุกท่าได้ล่วงหน้าตั้งแต่ตอนที่ท่าแรกออก
 *
 * offset ของแต่ละท่า = ผลรวม duration ของท่าก่อนหน้า (ท่าถัดไปเริ่มตอนท่าก่อนหน้าจบพอดี)
 *
 * กติกา lock ของคอมโบ — **หน้าต่างเดียวครอบทั้งคอมโบ**:
 *   - ท่าแรกเรียก `scheduleStartCombo(event, ผลรวม duration ทุกท่า)` → ได้ lock window 1 ช่วงยาว
 *   - ท่าที่เหลือใช้ `schedule()` ธรรมดา ไม่ออก lock ของตัวเอง
 *   - ทุกท่าเป็น `isManual: false` — `GlobalLockChange` เป็นเจ้าของ isGlobalLocked แต่ผู้เดียว
 *
 * ⚠️ ห้ามเรียก `scheduleStartCombo` ทุกท่า — จะได้ lock window ต่อกัน 3 ช่วง แล้วที่รอยต่อ
 * (เช่น f25) `lock-on` ของท่าถัดไป priority -1 จะออกก่อน `lock-off` ของท่าก่อนหน้า priority +1
 * ผลคือ lock ถูกปลดทิ้งกลางคอมโบ
 *
 * `field.currentFrame`/`field.enemiesInRange()` ยังถูกอ่าน **ตอน action ถูก execute จริง** เหมือนเดิม
 * — เปลี่ยนแค่ว่า execute ครั้งเดียวได้ event ครบทั้งคอมโบ ไม่ใช่ execute ทีละท่า
 */
function rotation(unit: AllyUnit, comboName: string, ...steps: Step[]): (field: BattleField) => Queue<RotationAction> {
    return (field) =>
        new RotationBuilder()
            .add(comboName, () => {
                const t0     = field.currentFrame;
                const total  = steps.reduce((sum, [, , move]) => sum + move.duration, 0);
                let   offset = 0;

                steps.forEach(([name, actionType, move, range = SkillRange.Contact], i) => {
                    const t     = t0 + offset;
                    const event = new AttackActionEvent(`${name}-f${t}`, unit, actionType, false, () => console.log(`[f${t}] ${name}`));

                    // ท่าแรกเป็นคนพก lock window ของทั้งคอมโบมาด้วย (offset ของมันคือ 0 เสมอ)
                    // ที่เหลือ schedule เปล่าๆ พร้อม offset ของตัวเอง
                    if (i === 0) field.scheduleStartCombo(event, total);
                    else         field.schedule(event, offset);

                    field.schedule(
                        new DamageEvent(
                            `${name}-dmg-f${t}`,
                            new Damage(unit, name, actionType, field.enemiesInRange(range))
                                .setMultipliers([move.type, move.mtpr / 100]),
                            unit,
                        ),
                        offset + move.damageFrame,
                    );

                    offset += move.duration;
                });
            })
            .build();
}

export function setupMornye(unit: AllyUnit): void {
    unit.baseHp      = 15375;
    unit.baseAtk     = 288;
    unit.baseDef     = 1357;
    unit.elementType = ElementType.Fusion;
    unit.weaponType  = WeaponType.Broadblade;

    unit.addDefaultStat(StatsType.DefP, 15.2);
    unit.addDefaultStat(StatsType.HealBonus, 12);

    // ═══════════════════════════════════════════════════════════════════════════
    // ⚠️ "BA Combo" จงใจเขียนแบบกางเต็ม ไม่ใช้ helper `rotation()` — ห้ามยุบทิ้ง
    //
    // นี่คือ **ฉบับอ้างอิงสำหรับอ่านทำความเข้าใจ** ว่า 1 action ในคิวของ RotationDirector
    // ถูกกางออกเป็น event จริงใน BattleField ยังไง — rotation ที่เหลือทั้งหมดข้างล่างคือ
    // ก้อนนี้แหละ แค่ผ่าน `rotation()` แล้วป้อนค่าที่ต่างกันเข้าไป
    //
    // ต้นทุนคือโค้ดซ้ำ 1 ชุด ซึ่งเรายอมจ่าย เพราะถ้าเก็บเป็น comment แทน มันจะไม่ถูก
    // typecheck และเน่าเงียบๆ ทันทีที่ signature ไหนเปลี่ยน (Damage เพิ่งโดนมาแล้วรอบนึง)
    // อยู่แบบโค้ดจริง = tsc คอยเฝ้าให้ว่ามันยังตรงกับ engine ปัจจุบันเสมอ
    //
    // 📌 ถ้า AI/refactor ตัวไหนมาเห็นแล้วอยากยุบให้ไปใช้ `rotation()` เหมือนตัวอื่น — อย่า
    //    ความซ้ำตรงนี้คือของที่ตั้งใจไว้ ไม่ใช่ของที่หลงเหลือ
    // ═══════════════════════════════════════════════════════════════════════════
    unit.rotations.set("BA Combo", (field) =>
        new RotationBuilder()

            // ทั้งคอมโบเป็น RotationAction **ตัวเดียว** — execute ครั้งเดียวได้ event ครบ 8 ตัว
            // (ท่า 3 + ดาเมจ 3 + lock-on/lock-off อีก 2 ที่ scheduleStartCombo แถมให้)
            .add("Mornye-BA-Combo", () => {

                // frame ที่คอมโบ "เริ่ม" — ท่าที่เหลือคำนวณเป็น offset นับจากตรงนี้ทั้งหมด
                // อ่านสดตอน execute เหมือนเดิม (ยังไม่ใช่ตอนสร้าง queue)
                const t0 = field.currentFrame;

                // ความยาวรวมของคอมโบ = อายุของ GlobalLock ที่จะถูกล็อกทีเดียวยาวๆ
                const TOTAL = BA1.duration + BA2.duration + BA3.duration;   // 25 + 55 + 53 = 133

                // ── ท่าที่ 1: BA1 — เริ่มทันทีที่คอมโบเริ่ม ────────────────────
                const OFFSET_BA1 = 0;
                const T_BA1      = t0 + OFFSET_BA1;

                // scheduleStartCombo = schedule() ธรรมดา + แถม GlobalLockChange คู่หนึ่ง
                //   f0        GlobalLockChange(1)  ล็อก   (priority -1 → ออกก่อนใครในเฟรมนั้น)
                //   f0 + 133  GlobalLockChange(0)  ปลด    (priority +1 → ออกหลังใครในเฟรมนั้น)
                // ไม่มี offset ให้ใส่ — ตัว event ลงที่ currentFrame เสมอ (คอมโบเริ่มเดี๋ยวนี้)
                // ท่าแรกเท่านั้นที่เรียกตัวนี้ — ท่าที่เหลือใช้ schedule() เปล่าพร้อม offset ของตัวเอง
                // ถ้าเรียกทุกท่าจะได้ lock window ซ้อนกัน 3 ช่วง แล้วปลดผิดจังหวะที่รอยต่อ
                field.scheduleStartCombo(
                    new AttackActionEvent(
                        `Mornye-BA1-f${T_BA1}`,
                        unit,
                        ActionType.BA,
                        false,                    // isManual — ปล่อย false ให้ GlobalLockChange
                        () => console.log(`[f${T_BA1}] Mornye-BA1`),   // เป็นเจ้าของ lock แต่ผู้เดียว
                    ),
                    TOTAL,                        // อายุ lock ของทั้งคอมโบ
                );

                field.schedule(
                    new DamageEvent(
                        `Mornye-BA1-dmg-f${T_BA1}`,
                        new Damage(unit, "Mornye-BA1", ActionType.BA, field.enemiesInRange(SkillRange.Contact))
                            .setMultipliers([BA1.type, BA1.mtpr / 100]),   // mtpr เก็บเป็น % → หาร 100
                        unit,
                    ),
                    OFFSET_BA1 + BA1.damageFrame,                          // 0 + 15 = 15
                );

                // ── ท่าที่ 2: BA2 — เริ่มตอน BA1 จบพอดี ────────────────────────
                // นี่คือหัวใจของการ push พร้อมกัน: แทนที่จะรอ lock ปลดแล้วให้ Director
                // สั่งท่าถัดไป เราบวก duration เองตั้งแต่ตอนนี้เลย
                const OFFSET_BA2 = OFFSET_BA1 + BA1.duration;              // 0 + 25 = 25
                const T_BA2      = t0 + OFFSET_BA2;

                field.schedule(
                    new AttackActionEvent(
                        `Mornye-BA2-f${T_BA2}`,
                        unit,
                        ActionType.BA,
                        false,
                        () => console.log(`[f${T_BA2}] Mornye-BA2`),
                    ),
                    OFFSET_BA2,
                );

                field.schedule(
                    new DamageEvent(
                        `Mornye-BA2-dmg-f${T_BA2}`,
                        new Damage(unit, "Mornye-BA2", ActionType.BA, field.enemiesInRange(SkillRange.Contact))
                            .setMultipliers([BA2.type, BA2.mtpr / 100]),
                        unit,
                    ),
                    OFFSET_BA2 + BA2.damageFrame,                          // 25 + 15 = 40
                );

                // ── ท่าที่ 3: BA3 — ท่าสุดท้าย ─────────────────────────────────
                const OFFSET_BA3 = OFFSET_BA2 + BA2.duration;              // 25 + 55 = 80
                const T_BA3      = t0 + OFFSET_BA3;

                field.schedule(
                    new AttackActionEvent(
                        `Mornye-BA3-f${T_BA3}`,
                        unit,
                        ActionType.BA,
                        false,
                        () => console.log(`[f${T_BA3}] Mornye-BA3`),
                    ),
                    OFFSET_BA3,
                );

                field.schedule(
                    new DamageEvent(
                        `Mornye-BA3-dmg-f${T_BA3}`,
                        new Damage(unit, "Mornye-BA3", ActionType.BA, field.enemiesInRange(SkillRange.Contact))
                            .setMultipliers([BA3.type, BA3.mtpr / 100]),
                        unit,
                    ),
                    OFFSET_BA3 + BA3.damageFrame,                          // 80 + 25 = 105
                );
                                                                           // lock ปลดที่ 80 + 53 = 133
            })

            // .build() คืน Queue<RotationAction> ที่มี **1 ช่อง** — ยังไม่มี event สักตัวใน IPQ
            // event ทั้ง 8 จะเกิดพร้อมกันตอน execute() ของ action ตัวนี้เท่านั้น
            .build()
    );

    // ── rotation ที่เหลือ: ก้อนเดียวกับข้างบน แต่ผ่าน helper ────────────────────
    unit.rotations.set("EBA Combo",  rotation(unit, "Mornye-EBA-Combo",
        ["Mornye-EBA1", ActionType.BA, EBA1],
        ["Mornye-EBA2", ActionType.BA, EBA2],
        ["Mornye-EBA3", ActionType.BA, EBA3],
    ));

    unit.rotations.set("HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME", rotation(unit, "Mornye-HA-GeopotentialShift",
        ["Mornye-HA-GeopotentialShift", ActionType.HA, HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME],
    ));

    unit.rotations.set("HA_INVERSION_DAMAGE_FRAME", rotation(unit, "Mornye-HA-Inversion",
        ["Mornye-HA-Inversion", ActionType.HA, HA_INVERSION_DAMAGE_FRAME],
    ));

    unit.rotations.set("ESkill", rotation(unit, "Mornye-ESkill",
        ["Mornye-ESkill", ActionType.Skill, ESkill],
    ));

    unit.rotations.set("Ult", rotation(unit, "Mornye-Ult",
        ["Mornye-Ult", ActionType.Ult, Ult],
    ));

    unit.rotations.set("Intro", rotation(unit, "Mornye-Intro",
        ["Mornye-Intro", ActionType.Intro, Intro],
    ));
}
