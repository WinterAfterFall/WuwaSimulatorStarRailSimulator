import { AllyUnit } from "../../AllyUnit";
import { RotationBuilder } from "../../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType, ActionType, SkillRange } from "../../../Constants/Enum";
import { AttackActionEvent } from "../../Combat/CombatEvent/AttackActionEvent";
import { DamageEvent } from "../../Combat/CombatEvent/DamageEvent";
import { Damage } from "../../Combat/Damage";

//ประกาศค่า Frame
const BA1_DURATION = 25;
const BA2_DURATION = 55;
const BA3_DURATION = 53;
const EBA1_DURATION = 21;
const EBA2_DURATION = 62;
const EBA3_DURATION = 32;
const HA_GEOPOTENTIAL_SHIFT_DURATION = 85;
const HA_INVERSION_DURATION = 107; //88
const INTRO_DURATION = 101;
const ULT_DURATION = 0;
const ENSKILL_DURATION = 76;

const BA1_DAMAGE_FRAME = 15;
const BA2_DAMAGE_FRAME = 15;
const BA3_DAMAGE_FRAME = 25;
const EBA1_DAMAGE_FRAME = 10;
const EBA2_DAMAGE_FRAME = 10;
const EBA3_DAMAGE_FRAME = 10;
const HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME = 25;
const HA_INVERSION_DAMAGE_FRAME = 84;
const INTRO_DAMAGE_FRAME = 41;
const ULT_DAMAGE_FRAME = 0;
const ENSKILL_DAMAGE_FRAME = 53;

// ประกาศค่า % ดาเมจ (ATK scaling) ต่อท่า — รวมทุก hit ในท่านั้นไว้ในตัวเดียว
const BA1_DMG = 22.27 + 16.71 * 2;
const BA2_DMG = 23.86 + 23.86 + 17.90 * 4;
const BA3_DMG = 41.36 + 10.34 * 6;

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
                timeline.schedule(new AttackActionEvent(`Mornye-BA1-f${t}`, t, BA1_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Mornye-BA1`), timeline));
                timeline.schedule(new DamageEvent(`Mornye-BA1-dmg-f${t}`, t + BA1_DAMAGE_FRAME, new Damage(unit, "Mornye-BA1", ActionType.BA, SkillRange.Contact).setMultipliers(BA1_DMG / 100, 0, 0, 0), unit, 0, undefined, timeline.triggerBus));
            })
            .add("Mornye-BA2", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Mornye-BA2-f${t}`, t, BA2_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Mornye-BA2`), timeline));
                timeline.schedule(new DamageEvent(`Mornye-BA2-dmg-f${t}`, t + BA2_DAMAGE_FRAME, 
                    new Damage(unit, "Mornye-BA2", ActionType.BA, SkillRange.Contact).setMultipliers(BA2_DMG / 100, 0, 0, 0), unit, 0, undefined, timeline.triggerBus));
            })
            .add("Mornye-BA3", () => {
                const t = timeline.currentFrame;
                timeline.schedule(new AttackActionEvent(`Mornye-BA3-f${t}`, t, BA3_DURATION, unit, ActionType.BA, true, 0, () => console.log(`[f${t}] Mornye-BA3`), timeline));
                timeline.schedule(new DamageEvent(`Mornye-BA3-dmg-f${t}`, t + BA3_DAMAGE_FRAME, new Damage(unit, "Mornye-BA3", ActionType.BA, SkillRange.Contact).setMultipliers(BA3_DMG / 100, 0, 0, 0), unit, 0, undefined, timeline.triggerBus));
            })
            .build()
    );
}