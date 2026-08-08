import { AllyUnit } from "./Models/AllyUnit";
import { setupTest1 } from "./Data/Characters/Test1";
import { setupTest2 } from "./Data/Characters/Test2";
import { Simulate } from "./Simulator/Simulate";
import { RotationAction } from "./Models/Combat/RotationAction";
import { Queue } from "./Utils/queue";

const F = 60; // 1 วินาที = 60 frame

// ─────────────────────────────────────────────────────────────
// manualBuilder — ซีนตัวอย่างสำหรับรันด้วยมือ (dev test version)
// การต่อสายทั้งหมดอยู่ใน Simulate แล้ว ไฟล์นี้เหลือแค่ "ใครอยู่ในสนาม ตีท่าอะไรบ้าง"
// ─────────────────────────────────────────────────────────────
const sim = new Simulate();

// addAlly ตัวแรกกลายเป็น onFieldChar ให้เอง ไม่ต้องตั้งมือ
const test1 = sim.addAlly(new AllyUnit("Test1"));
setupTest1(test1);
test1.isOnField = true;

const test2 = sim.addAlly(new AllyUnit("Test2"));
setupTest2(test2);

// ─────────────────────────────────────────────────────────────
// รวม rotation ของ test1 + test2 เข้า queue เดียว (factory → Queue ใหม่)
//   - setupQueue: ใช้ครั้งเดียวตอนเปิดฉาก (Burst)
//   - loopQueue : วนซ้ำตาม maxLoops (Standard)
// ─────────────────────────────────────────────────────────────
function mergeQueues(...queues: Queue<RotationAction>[]): Queue<RotationAction> {
    const merged = new Queue<RotationAction>();
    for (const q of queues) {
        while (!q.isEmpty()) merged.enqueue(q.dequeue()!);
    }
    return merged;
}

const setupQueue = mergeQueues(test1.rotations.get("Burst")!(sim.battleField),    test2.rotations.get("Burst")!(sim.battleField));
const loopQueue  = mergeQueues(test1.rotations.get("Standard")!(sim.battleField), test2.rotations.get("Standard")!(sim.battleField));
const maxLoops   = 2;

// ─────────────────────────────────────────────────────────────
// รัน
// ─────────────────────────────────────────────────────────────
console.log(`=== Combat Start — setup=[${setupQueue.toArray().map(a => a.name).join(", ")}], loop=[${loopQueue.toArray().map(a => a.name).join(", ")}], maxLoops=${maxLoops} ===\n`);

const loopsCompleted = sim.run(setupQueue, loopQueue, maxLoops);

const frame = sim.battleField.currentFrame;
console.log(`\n=== Combat End (frame=${frame}, t=${(frame / F).toFixed(2)}s, loops completed=${loopsCompleted}) ===`);
