import { AllyUnit } from "./Models/AllyUnit";
import { setupTest1 } from "./Models/Characters/Test1";
import { CombatTimeline } from "./Simulator/CombatTimeline";
import { RotationDirector } from "./Simulator/RotationDirector";

const F = 60; // 1 วินาที = 60 frame

// ─────────────────────────────────────────────────────────────
// 1. สร้าง Unit จาก setup function
// ─────────────────────────────────────────────────────────────
const test1 = new AllyUnit("Test1");
setupTest1(test1);
test1.isOnField = true;

// ─────────────────────────────────────────────────────────────
// 2. สร้าง CombatTimeline
// ─────────────────────────────────────────────────────────────
const timeline = new CombatTimeline();
timeline.onFieldChar = test1;

// ─────────────────────────────────────────────────────────────
// 3. เลือก rotation จาก rotations ของตัวละคร (factory → Queue ใหม่)
//    - Setup queue: ใช้ครั้งเดียวตอนเปิดฉาก (Burst)
//    - Loop queue : วนซ้ำตาม maxLoops (Standard)
// ─────────────────────────────────────────────────────────────
const setupQueue = test1.rotations.get("Burst")!();
const loopQueue  = test1.rotations.get("Standard")!();

// ─────────────────────────────────────────────────────────────
// 4. RotationDirector — ขับ setupQueue ก่อน แล้ววน loopQueue ตาม maxLoops
// ─────────────────────────────────────────────────────────────
const maxLoops = 2;
const director = new RotationDirector(timeline, setupQueue, loopQueue, maxLoops);

// ─────────────────────────────────────────────────────────────
// 5. รัน Simulation
// ─────────────────────────────────────────────────────────────
console.log(`=== Combat Start — setup=[${setupQueue.toArray().map(a => a.name).join(", ")}], loop=[${loopQueue.toArray().map(a => a.name).join(", ")}], maxLoops=${maxLoops} ===\n`);
director.run();
console.log(`\n=== Combat End (frame=${timeline.currentFrame}, t=${(timeline.currentFrame / F).toFixed(2)}s, loops completed=${director.currentLoopCount}) ===`);
