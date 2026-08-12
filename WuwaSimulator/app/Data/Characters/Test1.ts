import { AllyUnit } from "../../Models/AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType } from "../../Constants/Enum";
import { AttackActionEvent } from "../../Models/Combat/CombatEvent/AttackActionEvent";
import { SwapCharacterEvent } from "../../Models/Combat/CombatEvent/SwapCharacterEvent";

const BA_DURATION    = 30;   // 0.5s
const SKILL_DURATION = 60;   // 1.0s
const ULT_DURATION   = 90;   // 1.5s

export function setupTest1(unit: AllyUnit): void {
    unit.baseAtk     = 100;
    unit.baseHp      = 1000;
    unit.baseDef     = 100;
    unit.elementType = ElementType.Spectro;
    unit.weaponType  = WeaponType.Sword;
    unit.maxEnergy   = 100;

    // ต้องลง defaultStats คู่กับ stats เสมอ — resetAllUnits() ก่อนเริ่มรอบใหม่ set ทุก key ใน stats
    // เป็น 0 ก่อนแล้วค่อยเอา defaultStats ทับ ถ้าไม่ลงไว้ค่าจะหายไปเงียบๆ ตั้งแต่รอบแรก
    unit.setDefaultStat(StatsType.CR, 0.05);
    unit.setDefaultStat(StatsType.CD, 1.5);
    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    unit.rotations.set("Standard", (battleField) =>
        new RotationBuilder()
            .add("Test1-BA1", () => {
                const t = battleField.currentFrame;
                const event = new AttackActionEvent(`Test1-BA1-f${t}`, unit, ActionType.BA);
                battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-BA1`));
                battleField.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .add("Test1-BA2", () => {
                const t = battleField.currentFrame;
                const event = new AttackActionEvent(`Test1-BA2-f${t}`, unit, ActionType.BA);
                battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-BA2`));
                battleField.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .add("Test1-Skill", () => {
                const t = battleField.currentFrame;
                const event = new AttackActionEvent(`Test1-Skill-f${t}`, unit, ActionType.Skill);
                battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-Skill`));
                // ท่าสุดท้ายของ test1 ใน Standard — ต่อด้วย test2 ใน mergeQueues เสมอ
                // สั่ง swap ต่อท้ายท่าจริงเอง (ห้ามท่าที่มีแต่สลับตัวเฉยๆ)
                battleField.appendOnExecute(event, () => battleField.schedule(new SwapCharacterEvent()));
                battleField.scheduleStartOnFieldAction(event, SKILL_DURATION);
            })
            .build()
    );

    unit.rotations.set("Burst", (battleField) =>
        new RotationBuilder()
            .add("Test1-Ult", () => {
                const t = battleField.currentFrame;
                const event = new AttackActionEvent(`Test1-Ult-f${t}`, unit, ActionType.Ult);
                battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-Ult`));
                battleField.scheduleStartOnFieldAction(event, ULT_DURATION);
            })
            .add("Test1-BA1", () => {
                const t = battleField.currentFrame;
                const event = new AttackActionEvent(`Test1-BA1-f${t}`, unit, ActionType.BA);
                battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-BA1`));
                // ท่าสุดท้ายของ test1 ใน Burst — ต่อด้วย test2 ใน mergeQueues เสมอ
                battleField.appendOnExecute(event, () => battleField.schedule(new SwapCharacterEvent()));
                battleField.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .build()
    );
}
