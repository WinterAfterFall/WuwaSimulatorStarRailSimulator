import { AllyUnit } from "../../Models/AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType } from "../../Constants/Enum";
import { AttackActionEvent } from "../../Models/Combat/CombatEvent/AttackActionEvent";

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

    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    unit.rotations.set("Standard", (timeline) =>
        new RotationBuilder()
            .add("Test1-BA1", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Test1-BA1-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Test1-BA1`)), BA_DURATION);
            })
            .add("Test1-BA2", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Test1-BA2-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Test1-BA2`)), BA_DURATION);
            })
            .add("Test1-Skill", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Test1-Skill-f${t}`, unit, ActionType.Skill, () => console.log(`[f${t}] Test1-Skill`)), SKILL_DURATION);
            })
            .build()
    );

    unit.rotations.set("Burst", (timeline) =>
        new RotationBuilder()
            .add("Test1-Ult", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Test1-Ult-f${t}`, unit, ActionType.Ult, () => console.log(`[f${t}] Test1-Ult`)), ULT_DURATION);
            })
            .add("Test1-BA1", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Test1-BA1-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Test1-BA1`)), BA_DURATION);
            })
            .build()
    );
}
