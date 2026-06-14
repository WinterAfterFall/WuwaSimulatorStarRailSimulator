import { AllyUnit } from "../AllyUnit";
import { RotationBuilder } from "../../Simulator/RotationBuilder";
import { ElementType, WeaponType, StatsType } from "../../Constants/Enum";

/**
 * Test1 — ตัวละครทดสอบ มี 2 rotations
 */
export function setupTest1(unit: AllyUnit): void {
    // --- Base Stats ---
    unit.baseAtk = 100;
    unit.baseHp  = 1000;
    unit.baseDef = 100;
    unit.elementType = ElementType.Spectro;
    unit.weaponType  = WeaponType.Sword;
    unit.maxEnergy   = 100;

    unit.setStat(StatsType.CR, 0.05);
    unit.setStat(StatsType.CD, 1.5);

    // --- Rotations ---
    unit.rotations.set("Standard", () =>
        new RotationBuilder()
            .add("Test1-BA1",   () => console.log("Test1-BA1"))
            .add("Test1-BA2",   () => console.log("Test1-BA2"))
            .add("Test1-Skill", () => console.log("Test1-Skill"))
            .build()
    );

    unit.rotations.set("Burst", () =>
        new RotationBuilder()
            .add("Test1-Ult", () => console.log("Test1-Ult"))
            .add("Test1-BA1", () => console.log("Test1-BA1"))
            .build()
    );
}
