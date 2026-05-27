import { IndexedPriorityQueue } from "../../Utils/indexedPriorityQueue"; // เปลี่ยน path ให้ตรงกับไฟล์ของคุณ

// 1. จำลองข้อมูล Unit ในเกม
interface BattleUnit {
    name: string;
    actionValue: number; // ยิ่งน้อยยิ่งได้เทิร์นเร็ว
    level: number;       // ใช้เป็นเงื่อนไขตัดสินกรณี AV เท่ากัน
}

function runAdvancedTest() {
    console.log("--- ⚔️ Starting Advanced IPQ Battle Test ---");

    /**
     * 2. สร้างคิวพร้อม Custom Comparator:
     * - ลำดับแรก: ใคร Action Value (AV) น้อยกว่า ได้เทิร์นก่อน
     * - ลำดับสอง: ถ้า AV เท่ากัน ใคร Level สูงกว่า (เก่งกว่า) ได้เทิร์นก่อน
     */
    const turnQueue = new IndexedPriorityQueue<BattleUnit>((a, b) => {
        if (a.actionValue === b.actionValue) {
            return b.level - a.level; // มากไปน้อย (Max-Heap สำหรับ Level)
        }
        return a.actionValue - b.actionValue; // น้อยไปมาก (Min-Heap สำหรับ AV)
    });

    // 3. ทดสอบการ Push (ส่ง Data ก่อน แล้วตามด้วย Name)
    console.log("\n[Test 1] Pushing Units...");
    turnQueue.push({ name: "Rover", actionValue: 100, level: 80 }, "Rover");
    turnQueue.push({ name: "Yangyang", actionValue: 100, level: 90 }, "Yangyang"); // AV เท่า Rover แต่เวลสูงกว่า
    turnQueue.push({ name: "Chixia", actionValue: 120, level: 75 }, "Chixia");
    turnQueue.push({ name: "Verina", actionValue: 50, level: 85 }, "Verina");

    console.log(`Queue Size: ${turnQueue.size} (Expected: 4)`);

    // 4. ทดสอบลำดับเริ่มต้น
    // ลำดับที่คาดหวัง: Verina (50) -> Yangyang (100, Lv90) -> Rover (100, Lv80) -> Chixia (120)
    console.log("\n[Test 2] Checking Initial Order...");
    const first = turnQueue.getByName("Verina");
    console.log(`Top priority: ${first?.name} (Expected: Verina)`);

    // 5. ทดสอบการ Update (หัวใจสำคัญ)
    // สถานการณ์: Chixia ใช้สกิลบัฟตัวเอง ทำให้ Action Value ลดลงจาก 120 เหลือ 40
    console.log("\n[Test 3] Chixia uses Burst! (AV 120 -> 40)...");
    const updatedChixia: BattleUnit = { name: "Chixia", actionValue: 40, level: 75 };
    turnQueue.update("Chixia", updatedChixia);

    // 6. ทดสอบการ Pop หลังจากอัปเดต
    // ตอนนี้ Chixia (40) ต้องแซง Verina (50) ขึ้นมาเป็นเบอร์ 1
    console.log("\n[Test 4] Verifying order after Chixia's buff...");
    
    const p1 = turnQueue.pop(); // Expected: Chixia (40)
