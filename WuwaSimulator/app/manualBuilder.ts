import { AllyUnit } from "./Models/AllyUnit";
import { ActionType, ElementType } from "./Constants/Enum";
import { CombatTimeline } from "./Simulator/CombatTimeline";
import { RotationBuilder } from "./Simulator/RotationBuilder";
import { RotationDirector } from "./Simulator/RotationDirector";

const F = 60; // 1 วินาที = 60 frame

// ─────────────────────────────────────────────────────────────
// 1. สร้าง Unit
// ─────────────────────────────────────────────────────────────
const rover = new AllyUnit("Rover");
rover.baseAtk     = 1000;
rover.elementType = ElementType.Spectro;
rover.isOnField   = true;   // Rover เริ่มบนสนาม

// ─────────────────────────────────────────────────────────────
// 2. สร้าง CombatTimeline (Variable 2 — engine)
// ─────────────────────────────────────────────────────────────
const timeline = new CombatTimeline();
timeline.onFieldChar = rover;

// ─────────────────────────────────────────────────────────────
// 3. Setup Rotation (Variable 1) — รอบแรกเท่านั้น ดึงจนหมดแล้วไม่เติม
// ─────────────────────────────────────────────────────────────
const setupQueue = new RotationBuilder()
    .add(rover, ActionType.Intro, 30)
    .build();

// ─────────────────────────────────────────────────────────────
// 4. Loop Rotation (Variable 3) — รอบวนซ้ำ แบบ pushback
// ─────────────────────────────────────────────────────────────
const loopQueue = new RotationBuilder()
    .add(rover, ActionType.BA,    20)
    .add(rover, ActionType.BA,    20)
    .add(rover, ActionType.BA,    20)
    .add(rover, ActionType.Skill, 40)
    .add(rover, ActionType.Ult,   60)
    .add(rover, ActionType.Outro, 30)
    .build();

// ─────────────────────────────────────────────────────────────
// 5. RotationDirector — central dispatcher (pull-based)
//    maxLoops กำหนดก่อน simulation เริ่ม (วน loopQueue ได้กี่รอบ)
// ─────────────────────────────────────────────────────────────
const maxLoops = 2;
const director = new RotationDirector(timeline, setupQueue, loopQueue, maxLoops);

// ─────────────────────────────────────────────────────────────
// 6. รัน Simulation
//    NotificationEvent(EndAction) ของแต่ละ action ถูก schedule
//    อัตโนมัติโดย CombatTimeline.tick() — ไม่ต้อง push เองอีกต่อไป
// ─────────────────────────────────────────────────────────────
console.log(`=== Combat Start — setup=${setupQueue.length}, loop=${loopQueue.length}, maxLoops=${maxLoops} ===\n`);
director.run();
console.log(`\n=== Combat End (frame=${timeline.currentFrame}, t=${(timeline.currentFrame / F).toFixed(2)}s, loops completed=${director.currentLoopCount}) ===`);
