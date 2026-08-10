import { AllyUnit } from "../../Models/AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType } from "../../Constants/Enum";
import { AttackActionEvent } from "../../Models/Combat/CombatEvent/AttackActionEvent";

const BA_DURATION    = 30;   // 0.5s
const SKILL_DURATION = 60;   // 1.0s
const ULT_DURATION   = 90;   // 1.5s
const ECHO_DURATION  = 45;   // 0.75s

export function setupTest2(unit: AllyUnit): void {
    unit.baseAtk     = 80;
    unit.baseHp      = 1200;
    unit.baseDef     = 120;
    unit.elementType = ElementType.Havoc;
    unit.weaponType  = WeaponType.Gauntlets;
    unit.maxEnergy   = 150;

    // ลง defaultStats คู่กันเสมอ — ดูเหตุผลใน Test1.ts
    unit.setDefaultStat(StatsType.CR, 0.05);
    unit.setDefaultStat(StatsType.CD, 1.5);
    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    unit.rotations.set("Standard", (timeline) =>
        new RotationBuilder()
            .add("Test2-BA1", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-BA1-f${t}`, unit, ActionType.BA);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-BA1`));
                timeline.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .add("Test2-Skill", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-Skill-f${t}`, unit, ActionType.Skill);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-Skill`));
                timeline.scheduleStartOnFieldAction(event, SKILL_DURATION);
            })
            .add("Test2-BA2", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-BA2-f${t}`, unit, ActionType.BA);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-BA2`));
                timeline.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .build()
    );

    unit.rotations.set("Burst", (timeline) =>
        new RotationBuilder()
            .add("Test2-Ult", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-Ult-f${t}`, unit, ActionType.Ult);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-Ult`));
                timeline.scheduleStartOnFieldAction(event, ULT_DURATION);
            })
            .add("Test2-BA1", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-BA1-f${t}`, unit, ActionType.BA);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-BA1`));
                timeline.scheduleStartOnFieldAction(event, BA_DURATION);
            })
            .build()
    );

    unit.rotations.set("Echo Focus", (timeline) =>
        new RotationBuilder()
            .add("Test2-Echo", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-Echo-f${t}`, unit, ActionType.Echo);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-Echo`));
                timeline.scheduleStartOnFieldAction(event, ECHO_DURATION);
            })
            .add("Test2-Skill", () => {
                const t = timeline.currentFrame;
                const event = new AttackActionEvent(`Test2-Skill-f${t}`, unit, ActionType.Skill);
                timeline.appendOnExecute(event, () => console.log(`[f${t}] Test2-Skill`));
                timeline.scheduleStartOnFieldAction(event, SKILL_DURATION);
            })
            .build()
    );
}
