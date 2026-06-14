import { AllyUnit } from "../AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType } from "../../Constants/Enum";

/**
 * Test2 — ตัวละครทดสอบ มี 3 rotations
 */
export function setupTest2(unit: AllyUnit): void {
    // --- Base Stats ---
    unit.baseAtk = 80;
    unit.baseHp  = 1200;
    unit.baseDef = 120;
    unit.elementType = ElementType.Havoc;
    unit.weaponType  = WeaponType.Gauntlets;
    unit.maxEnergy   = 150;

    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    // --- Rotations ---
    unit.rotations.set("Standard", () =>
        new RotationBuilder()
            .add("Test2-BA1",   () => {})
            .add("Test2-Skill", () => {})
            .add("Test2-BA2",   () => {})
            .build()
    );

    unit.rotations.set("Burst", () =>
        new RotationBuilder()
            .add("Test2-Ult", () => {})
            .add("Test2-BA1", () => {})
            .build()
    );

    unit.rotations.set("Echo Focus", () =>
        new RotationBuilder()
            .add("Test2-Echo",  () => {})
            .add("Test2-Skill", () => {})
            .build()
    );
}
