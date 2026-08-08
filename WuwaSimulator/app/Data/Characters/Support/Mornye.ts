import { AllyUnit } from "../../../Models/AllyUnit";
import { RotationBuilder } from "../../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType, SkillRange, MultiplierType } from "../../../Constants/Enum";
import { AttackActionEvent } from "../../../Models/Combat/CombatEvent/AttackActionEvent";
import { DamageEvent } from "../../../Models/Combat/CombatEvent/DamageEvent";
import { Damage } from "../../../Models/Combat/Damage";
import { MoveData } from "../../../Models/Combat/MoveData";

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

export function setupMornye(unit: AllyUnit): void {
    unit.baseHp      = 15375;
    unit.baseAtk     = 288;
    unit.baseDef     = 1357;
    unit.elementType = ElementType.Fusion;
    unit.weaponType  = WeaponType.Broadblade;

    unit.addDefaultStat(StatsType.DefP, 15.2);
    unit.addDefaultStat(StatsType.HealBonus, 12);

    unit.rotations.set("BA Combo", (timeline) =>
        new RotationBuilder()
            .add("Mornye-BA1", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-BA1-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-BA1`)), BA1.duration);
                timeline.schedule(new DamageEvent(`Mornye-BA1-dmg-f${t}`, new Damage(unit, "Mornye-BA1", ActionType.BA, SkillRange.Contact).setMultipliers([BA1.type, BA1.mtpr / 100]), unit), BA1.damageFrame);
            })
            .add("Mornye-BA2", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-BA2-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-BA2`)), BA2.duration);
                timeline.schedule(new DamageEvent(`Mornye-BA2-dmg-f${t}`,
                    new Damage(unit, "Mornye-BA2", ActionType.BA, SkillRange.Contact).setMultipliers([BA2.type, BA2.mtpr / 100]), unit), BA2.damageFrame);
            })
            .add("Mornye-BA3", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-BA3-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-BA3`)), BA3.duration);
                timeline.schedule(new DamageEvent(`Mornye-BA3-dmg-f${t}`, new Damage(unit, "Mornye-BA3", ActionType.BA, SkillRange.Contact).setMultipliers([BA3.type, BA3.mtpr / 100]), unit), BA3.damageFrame);
            })
            .build()
    );

    unit.rotations.set("EBA Combo", (timeline) =>
        new RotationBuilder()
            .add("Mornye-EBA1", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-EBA1-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-EBA1`)), EBA1.duration);
                timeline.schedule(new DamageEvent(`Mornye-EBA1-dmg-f${t}`, new Damage(unit, "Mornye-EBA1", ActionType.BA, SkillRange.Contact).setMultipliers([EBA1.type, EBA1.mtpr / 100]), unit), EBA1.damageFrame);
            })
            .add("Mornye-EBA2", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-EBA2-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-EBA2`)), EBA2.duration);
                timeline.schedule(new DamageEvent(`Mornye-EBA2-dmg-f${t}`, new Damage(unit, "Mornye-EBA2", ActionType.BA, SkillRange.Contact).setMultipliers([EBA2.type, EBA2.mtpr / 100]), unit), EBA2.damageFrame);
            })
            .add("Mornye-EBA3", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-EBA3-f${t}`, unit, ActionType.BA, () => console.log(`[f${t}] Mornye-EBA3`)), EBA3.duration);
                timeline.schedule(new DamageEvent(`Mornye-EBA3-dmg-f${t}`, new Damage(unit, "Mornye-EBA3", ActionType.BA, SkillRange.Contact).setMultipliers([EBA3.type, EBA3.mtpr / 100]), unit), EBA3.damageFrame);
            })
            .build()
    );

    unit.rotations.set("HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME", (timeline) =>
        new RotationBuilder()
            .add("Mornye-HA-GeopotentialShift", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-HA-GeopotentialShift-f${t}`, unit, ActionType.HA, () => console.log(`[f${t}] Mornye-HA-GeopotentialShift`)), HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME.duration);
                timeline.schedule(new DamageEvent(`Mornye-HA-GeopotentialShift-dmg-f${t}`, new Damage(unit, "Mornye-HA-GeopotentialShift", ActionType.HA, SkillRange.Contact).setMultipliers([HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME.type, HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME.mtpr / 100]), unit), HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME.damageFrame);
            })
            .build()
    );

    unit.rotations.set("HA_INVERSION_DAMAGE_FRAME", (timeline) =>
        new RotationBuilder()
            .add("Mornye-HA-Inversion", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-HA-Inversion-f${t}`, unit, ActionType.HA, () => console.log(`[f${t}] Mornye-HA-Inversion`)), HA_INVERSION_DAMAGE_FRAME.duration);
                timeline.schedule(new DamageEvent(`Mornye-HA-Inversion-dmg-f${t}`, new Damage(unit, "Mornye-HA-Inversion", ActionType.HA, SkillRange.Contact).setMultipliers([HA_INVERSION_DAMAGE_FRAME.type, HA_INVERSION_DAMAGE_FRAME.mtpr / 100]), unit), HA_INVERSION_DAMAGE_FRAME.damageFrame);
            })
            .build()
    );

    unit.rotations.set("ESkill", (timeline) =>
        new RotationBuilder()
            .add("Mornye-ESkill", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-ESkill-f${t}`, unit, ActionType.Skill, () => console.log(`[f${t}] Mornye-ESkill`)), ESkill.duration);
                timeline.schedule(new DamageEvent(`Mornye-ESkill-dmg-f${t}`, new Damage(unit, "Mornye-ESkill", ActionType.Skill, SkillRange.Contact).setMultipliers([ESkill.type, ESkill.mtpr / 100]), unit), ESkill.damageFrame);
            })
            .build()
    );

    unit.rotations.set("Ult", (timeline) =>
        new RotationBuilder()
            .add("Mornye-Ult", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-Ult-f${t}`, unit, ActionType.Ult, () => console.log(`[f${t}] Mornye-Ult`)), Ult.duration);
                timeline.schedule(new DamageEvent(`Mornye-Ult-dmg-f${t}`, new Damage(unit, "Mornye-Ult", ActionType.Ult, SkillRange.Contact).setMultipliers([Ult.type, Ult.mtpr / 100]), unit), Ult.damageFrame);
            })
            .build()
    );

    unit.rotations.set("Intro", (timeline) =>
        new RotationBuilder()
            .add("Mornye-Intro", () => {
                const t = timeline.currentFrame;
                timeline.scheduleStartCombo(new AttackActionEvent(`Mornye-Intro-f${t}`, unit, ActionType.Intro, () => console.log(`[f${t}] Mornye-Intro`)), Intro.duration);
                timeline.schedule(new DamageEvent(`Mornye-Intro-dmg-f${t}`, new Damage(unit, "Mornye-Intro", ActionType.Intro, SkillRange.Contact).setMultipliers([Intro.type, Intro.mtpr / 100]), unit), Intro.damageFrame);
            })
            .build()
    );
}