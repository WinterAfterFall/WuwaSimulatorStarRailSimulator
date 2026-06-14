import { AllyUnit } from "../AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType, NotificationType } from "../../Constants/Enum";
import { AttackActionEvent } from "../Combat/CombatEvent/AttackActionEvent";
import { NotificationEvent } from "../Combat/CombatEvent/NotificationEvent";

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

    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    unit.rotations.set("Standard", (timeline) =>
        new RotationBuilder()
            .add("Test2-BA1", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-BA1-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test2-BA1`)));
                timeline.schedule(new NotificationEvent(`Test2-BA1-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test2-Skill", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-Skill-f${t}`, t, SKILL_DURATION, unit, ActionType.Skill, true, 0, () => console.log(`[f${t}] Test2-Skill`)));
                timeline.schedule(new NotificationEvent(`Test2-Skill-end-f${t}`, t + SKILL_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test2-BA2", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-BA2-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test2-BA2`)));
                timeline.schedule(new NotificationEvent(`Test2-BA2-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .build()
    );

    unit.rotations.set("Burst", (timeline) =>
        new RotationBuilder()
            .add("Test2-Ult", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-Ult-f${t}`, t, ULT_DURATION, unit, ActionType.Ult, true, 0, () => console.log(`[f${t}] Test2-Ult`)));
                timeline.schedule(new NotificationEvent(`Test2-Ult-end-f${t}`, t + ULT_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test2-BA1", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-BA1-f${t}`, t, BA_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Test2-BA1`)));
                timeline.schedule(new NotificationEvent(`Test2-BA1-end-f${t}`, t + BA_DURATION, NotificationType.EndAction, unit));
            })
            .build()
    );

    unit.rotations.set("Echo Focus", (timeline) =>
        new RotationBuilder()
            .add("Test2-Echo", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-Echo-f${t}`, t, ECHO_DURATION, unit, ActionType.Echo, true, 0, () => console.log(`[f${t}] Test2-Echo`)));
                timeline.schedule(new NotificationEvent(`Test2-Echo-end-f${t}`, t + ECHO_DURATION, NotificationType.EndAction, unit));
            })
            .add("Test2-Skill", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Test2-Skill-f${t}`, t, SKILL_DURATION, unit, ActionType.Skill, true, 0, () => console.log(`[f${t}] Test2-Skill`)));
                timeline.schedule(new NotificationEvent(`Test2-Skill-end-f${t}`, t + SKILL_DURATION, NotificationType.EndAction, unit));
            })
            .build()
    );
}
