import { Unit } from "../../Models/Unit";
import { StatsType, ActionType, ElementType, UnitStatus } from "../../Constants/Enum";

function runUnitTests() {
    console.log("--- Starting Unit System Test ---");

    // 1. ทดสอบ Constructor (สร้างตัวละครพร้อม Stats พื้นฐาน)
    const rover = new Unit("Rover", {
        [StatsType.AtkP]: 150,
        [StatsType.CR]: 5,
    });

    console.log(`[Test 1] Create Unit: ${rover.name}`);
    console.log(`- Base AtkP: ${rover.getStats(StatsType.AtkP)}`);   // Expected: 150
    console.log(`- Base CR  : ${rover.getStats(StatsType.CR)}`);     // Expected: 5

    // 2. ทดสอบ setStat + getStats แบบระบุ ActionType
    //    Key ที่ได้: "Atk%-Ult"
    rover.setStat(StatsType.AtkP, ActionType.Ult, 50);
    console.log(`\n[Test 2] Set Ult AtkP`);
    console.log(`- AtkP (Ult): ${rover.getStats(StatsType.AtkP, ActionType.Ult)}`); // Expected: 50

    // 3. ทดสอบ setStat + getStats แบบระบุ Element + Action
    //    Key ที่ได้: "Atk%-Spectro-Intro"
    rover.setStat(StatsType.AtkP, ElementType.Spectro, ActionType.Intro, 25);
    console.log(`\n[Test 3] Set Spectro+Intro AtkP`);
    console.log(`- AtkP (Spectro, Intro): ${rover.getStats(StatsType.AtkP, ElementType.Spectro, ActionType.Intro)}`); // Expected: 25

    // 4. ทดสอบ addStat (Buff สะสม)
    //    CR เริ่มต้น 5 + เพิ่ม 10 = 15
    rover.addStat(StatsType.CR, 10);
    console.log(`\n[Test 4] addStat CR +10`);
    console.log(`- CR after buff: ${rover.getStats(StatsType.CR)}`); // Expected: 15

    // 5. ทดสอบ addStat แบบ ActionType
    //    Ult AtkP เริ่ม 50 + เพิ่ม 30 = 80
    rover.addStat(StatsType.AtkP, ActionType.Ult, 30);
    console.log(`\n[Test 5] addStat Ult AtkP +30`);
    console.log(`- AtkP (Ult) after buff: ${rover.getStats(StatsType.AtkP, ActionType.Ult)}`); // Expected: 80

    // 6. ทดสอบ Debuff (ค่าติดลบ)
    rover.addStat(StatsType.FlatAtk, -20);
    console.log(`\n[Test 6] Debuff FlatAtk -20`);
    console.log(`- FlatAtk: ${rover.getStats(StatsType.FlatAtk)}`); // Expected: -20

    // 7. ทดสอบ hasStat
    console.log(`\n[Test 7] hasStat`);
    console.log(`- hasStat(AtkP)               : ${rover.hasStat(StatsType.AtkP)}`);                                    // Expected: true
    console.log(`- hasStat(AtkP, Ult)           : ${rover.hasStat(StatsType.AtkP, ActionType.Ult)}`);                   // Expected: true
    console.log(`- hasStat(AtkP, Spectro, Intro): ${rover.hasStat(StatsType.AtkP, ElementType.Spectro, ActionType.Intro)}`); // Expected: true
    console.log(`- hasStat(Dmg)                 : ${rover.hasStat(StatsType.Dmg)}`);                                    // Expected: false

    // 8. ทดสอบ isAlive / setDead
    console.log(`\n[Test 8] Lifecycle`);
    console.log(`- isAlive (before): ${rover.isAlive()}`); // Expected: true
    rover.setDead();
    console.log(`- isAlive (after setDead): ${rover.isAlive()}`); // Expected: false
    console.log(`- status: ${rover.status}`);                      // Expected: Death

    // 9. ตรวจโครงสร้าง Key ใน Map
    console.log("\n--- Internal Map Structure ---");
    rover.stats.forEach((value, key) => {
        console.log(`Key: "${key}" | Value: ${value}`);
    });
    // Expected keys:
    // "Atk%"               → 150
    // "Crit rate"          → 15
    // "Atk%-Ult"           → 80
    // "Atk%-Spectro-Intro" → 25
    // "FlatAtk"            → -20
}

runUnitTests();
