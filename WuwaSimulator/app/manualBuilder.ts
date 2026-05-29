import { AllyUnit } from "./Models/AllyUnit";
import { ActionType, ElementType, StatsType } from "./Constants/Enum";
import { CombatTimeline } from "./Simulator/CombatTimeline";
import { RotationBuilder } from "./Simulator/RotationBuilder";

// ─────────────────────────────────────────────────────────────
// 1. สร้าง Unit
// ─────────────────────────────────────────────────────────────
const rover = new AllyUnit("Rover");
rover.baseAtk     = 1000;
rover.elementType = ElementType.Spectro;

const jiyan = new AllyUnit("Jiyan");
jiyan.baseAtk     = 1200;
jiyan.elementType = ElementType.Aero;

// ─────────────────────────────────────────────────────────────
// 2. สร้าง CombatTimeline (IPQ ที่เรียง event ตาม time)
// ─────────────────────────────────────────────────────────────
const timeline = new CombatTimeline();

// ─────────────────────────────────────────────────────────────
// 3. กำหนด Rotation ผ่าน RotationBuilder
//    .add(unit, ActionType, time) — เรียงตาม time ได้เลย ไม่ต้องเรียงเอง
//    IPQ จะจัดให้ถูกต้องเอง
// ─────────────────────────────────────────────────────────────
const builder = new RotationBuilder(timeline);

builder
    // Rover Rotation
    .add(rover, ActionType.Intro,  0.00)
    .add(rover, ActionType.BA,     0.50)
    .add(rover, ActionType.BA,     1.00)
    .add(rover, ActionType.BA,     1.50)
    .add(rover, ActionType.Skill,  2.00)
    .add(rover, ActionType.Ult,    3.50)
    .add(rover, ActionType.Outro,  5.00)

    // Jiyan รับ Outro ต่อ
    .add(jiyan, ActionType.Intro,  5.00)
    .add(jiyan, ActionType.Skill,  5.50)
    .add(jiyan, ActionType.BA,     6.20)
    .add(jiyan, ActionType.BA,     6.80)
    .add(jiyan, ActionType.Ult,    7.50);

// ─────────────────────────────────────────────────────────────
// 4. รัน Simulation
// ─────────────────────────────────────────────────────────────
console.log(`=== Combat Start — ${builder.size} events queued ===\n`);
timeline.runAll();
console.log(`\n=== Combat End (t=${timeline.currentTime.toFixed(2)}s) ===`);
