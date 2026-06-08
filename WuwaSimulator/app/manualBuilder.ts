import { AllyUnit } from "./Models/AllyUnit";
import { ActionType, ElementType, NotificationType } from "./Constants/Enum";
import { CombatTimeline } from "./Simulator/CombatTimeline";
import { RotationBuilder } from "./Simulator/RotationBuilder";
import { NotificationEvent } from "./Models/Combat/CombatEvent/NotificationEvent";

const F = 60; // 1 วินาที = 60 frame

// ─────────────────────────────────────────────────────────────
// 1. สร้าง Unit
// ─────────────────────────────────────────────────────────────
const rover = new AllyUnit("Rover");
rover.baseAtk     = 1000;
rover.elementType = ElementType.Spectro;
rover.isOnField   = true;   // Rover เริ่มบนสนาม

const jiyan = new AllyUnit("Jiyan");
jiyan.baseAtk     = 1200;
jiyan.elementType = ElementType.Aero;

// ─────────────────────────────────────────────────────────────
// 2. สร้าง CombatTimeline
// ─────────────────────────────────────────────────────────────
const timeline = new CombatTimeline();
timeline.onFieldChar = rover;

// ─────────────────────────────────────────────────────────────
// 3. Rotation ผ่าน RotationBuilder
//    .add(unit, ActionType, startFrame, durationFrame)
// ─────────────────────────────────────────────────────────────
const builder = new RotationBuilder(timeline);

builder
    // Rover Rotation
    .add(rover, ActionType.Intro,  0 * F,  30)   // Intro: 0.0s, กินเวลา 0.5s
    .add(rover, ActionType.BA,    30 * F,  20)
    .add(rover, ActionType.BA,    50 * F,  20)
    .add(rover, ActionType.BA,    70 * F,  20)
    .add(rover, ActionType.Skill, 90 * F,  40)
    .add(rover, ActionType.Ult,  150 * F,  60)
    .add(rover, ActionType.Outro, 210 * F, 30);

// ตัวอย่าง notification event: Rover Ult transition → auto ที่ frame 170
// (push ด้วยมือ — ปกติ subclass ของ AllyUnit จะ push ใน execute())
timeline.schedule(new NotificationEvent(
    "rover-Ult-changeToAuto", 170 * F, NotificationType.ChangeToAuto, rover
));
timeline.schedule(new NotificationEvent(
    "rover-Ult-end", 210 * F, NotificationType.EndAction, rover
));

// ─────────────────────────────────────────────────────────────
// 4. รัน Simulation
// ─────────────────────────────────────────────────────────────
console.log(`=== Combat Start — ${builder.size} events queued ===\n`);
timeline.runAll();
console.log(`\n=== Combat End (frame=${timeline.currentFrame}, t=${(timeline.currentFrame / F).toFixed(2)}s) ===`);
