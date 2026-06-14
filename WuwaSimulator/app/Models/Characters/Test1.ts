import { AllyUnit } from "../AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType, NotificationType } from "../../Constants/Enum";
import { AttackActionEvent } from "../Combat/CombatEvent/AttackActionEvent";
import { NotificationEvent } from "../Combat/CombatEvent/NotificationEvent";

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
                timeline.schedule(new AttackActionEvent(`Test1-BA1-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test1-BA1`)));
                timeline.schedule(new NotificationEvent(`Test1-BA1-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test1-BA2", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test1-BA2-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test1-BA2`)));
                timeline.schedule(new NotificationEvent(`Test1-BA2-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test1-Skill", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test1-Skill-f${t}`, t, SKILL_DURATION, unit, ActionType.Skill, true, 0, () => console.log(`[f${t}] Test1-Skill`)));
                timeline.schedule(new NotificationEvent(`Test1-Skill-end-f${t}`, t + SKILL_DURATION, NotificationType.EndAction, unit));
            })
            .build()
    );

    unit.rotations.set("Burst", (timeline) =>
        new RotationBuilder()
            .add("Test1-Ult", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test1-Ult-f${t}`, t, ULT_DURATION, unit, ActionType.Ult, true, 0, () => console.log(`[f${t}] Test1-Ult`)));
                timeline.schedule(new NotificationEvent(`Test1-Ult-end-f${t}`, t + ULT_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test1-BA1", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test1-BA1-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test1-BA1`)));
                timeline.schedule(new NotificationEvent(`Test1-BA1-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .build()
    );
}
