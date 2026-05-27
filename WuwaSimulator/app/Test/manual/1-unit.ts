import { Unit } from "../../Models/Unit";
import { StatsType, ActionType, ElementType, UnitStatus } from "../../Constants/Enum";

function runUnitTests() {
    console.log("--- Starting Unit System Test ---");

    // 1. ทดสอบ Constructor (สร้างตัวละครพร้อม Stats พื้นฐาน)
    // สมมติ: เลือด 1000, พลังโจมตี 150, อัตราคริ 5%
    const rover = new Unit("Rover", {
        [StatsType.AtkP]: 150,
        [StatsType.CR]: 5,
    });

    const test1 = new Unit("Rover");

    console.log(`[Test 1] Create Unit: ${rover.name}`);
    console.log(`- Base AtkP: ${test1.getStats(StatsType.AtkP)}`); // Expected: 150

    // 2. ทดสอบการใช้ setStat แบบระบุ ActionType
    // เช่น: เพิ่มพลังโจมตีเฉพาะการใช้ท่าไม้ตาย (Ult)
    rover.setStat(StatsType.AtkP, ActionType.Ult, 50);
    console.log(`[Test 2] Set Ult Bonus AtkP: ${rover.getStats(StatsType.AtkP, ActionType.Ult)}`); // Expected: 50

    // 3. ทดสอบการใช้ setStat แบบระบุ Element + Action
    // เช่น: พลังโจมตีธาตุแสง (Spectro) ของท่า Intro
    rover.setStat(StatsType.AtkP, ElementType.Spectro, ActionType.Intro, 25);
    console.log(`[Test 3] Spectro Intro AtkP: ${rover.getStats(StatsType.AtkP, ElementType.Spectro, ActionType.Intro)}`); // Expected: 25

    // 4. ทดสอบ addStat (การได้รับ Buff)
    // เพิ่มอัตราคริ (CR) ขึ้นอีก 10%
    rover.addStat(StatsType.CR, 10);
    console.log(`[Test 4] Add CR +10%: Current CR = ${rover.getStats(StatsType.CR)}`); // Expected: 15 (5+10)

    // 5. ทดสอบการ Debuff (ค่าติดลบ)
    // โดนลดพลังโจมตี FlatAtk ลง 20
    rover.addStat(StatsType.FlatAtk, -20);
    console.log(`[Test 5] Debuff FlatAtk -20: ${rover.getStats(StatsType.FlatAtk)}`); // Expected: -20

    // 6. ตรวจสอบโครงสร้าง Key ใน Map (เพื่อให้เห็นภาพการเก็บข้อมูล)
    console.log("\n--- Internal Map Structure ---");
    rover.stats.forEach((value, key) => {
        console.log(`Key: "${key}" | Value: ${value}`);
    });

    // 7. ทดสอบสถานะตัวละคร
    console.log(`\n[Test 6] Status Check: ${rover.status === UnitStatus.Alive ? "Alive" : "Death"}`);
}

// รันฟังก์ชันทดสอบ
runUnitTests();
