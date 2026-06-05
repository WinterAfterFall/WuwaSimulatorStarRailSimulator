# WuwaSimulator — Project Overview

## จุดประสงค์
จำลองระบบการต่อสู้ของเกม **Wuthering Waves** เพื่อคำนวณ DPS และ simulate rotation ของตัวละคร

---

## โครงสร้างโปรเจกต์

```
app/
├── Constants/
│   └── Enum.ts                  # Enum ทั้งหมด
│
├── Models/
│   ├── Unit.ts                  # Base class ของทุก unit (stats system)
│   ├── AllyUnit.ts              # ตัวละครฝ่ายผู้เล่น extends Unit
│   └── Combat/
│       ├── CombatEvent.ts       # Abstract base ของทุก event ใน timeline
│       ├── ActionEvent.ts       # Abstract base ของทุก action
│       ├── AttackActionEvent.ts # Action โจมตี
│       ├── BuffActionEvent.ts   # Action buff skill
│       ├── DamageEvent.ts       # ความเสียหาย
│       ├── NotificationEvent.ts # Signal event (EndAction, ChangeToAuto, ฯลฯ)
│       ├── Damage.ts            # Data object สำหรับคำนวณ damage
│       ├── Attack.ts            # (stub)
│       └── AttackAction.ts      # (stub)
│
├── Services/
│   └── Damage/
│       └── DamageCalculate.ts   # สูตรคำนวณ damage (WuWa formula)
│
├── Simulator/
│   ├── CombatTimeline.ts        # จัดการ event ด้วย IPQ, เก็บ lock state
│   └── RotationBuilder.ts       # Pre-define rotation แล้วยัดลง timeline
│
├── Utils/
│   ├── queue.ts                 # FIFO Queue — O(1) ทุก op
│   ├── priorityQueue.ts         # Binary min-heap
│   └── indexedPriorityQueue.ts  # PQ + positionMap (update/delete ด้วยชื่อได้)
│
├── Test/
│   ├── manual/                  # รันด้วยมือ (ts-node)
│   │   ├── 1-unit.ts            # ทดสอบ Unit stats system
│   │   ├── 2-hello.ts
│   │   ├── 3-advanced-ipq.ts
│   │   └── 4-queue.ts
│   └── automated/               # Jest tests
│       └── Utils/
│
└── manualBuilder.ts             # Entry point ตัวอย่าง setup combat simulation
```

---

## Enum หลัก (`Constants/Enum.ts`)

| Enum | ค่า |
|---|---|
| `UnitStatus` | `Alive`, `Death` |
| `Side` | `None`, `Ally`, `Enemy` |
| `ActionState` | `Free`, `Busy` |
| `NotificationType` | `ChangeToAuto`, `EndAction`, `BuffExpired`, `DebuffExpired` |
| `StatsType` | `AtkP`, `FlatAtk`, `Hp`, `FlatHp`, `DefP`, `FlatDef`, `CR`, `CD`, `Dmg`, `Amp`, `Sp`, `DefRed`, `Respen`, `DmgRed`, `ElemRed` |
| `ActionType` | `None`, `BA`, `HA`, `Skill`, `Ult`, `Echo`, `Intro`, `Outro`, `TB` |
| `ElementType` | `None`, `Glacio`, `Fusion`, `Electro`, `Aero`, `Spectro`, `Havoc` |
| `WeaponType` | `None`, `Broadblade`, `Sword`, `Pistols`, `Gauntlets`, `Rectifier` |

---

## Stat System (`Unit.ts`)

Stats เก็บใน `Map<string, number>` โดย key สร้างจาก:

```
getStats(AtkP)                   → key: "Atk%"
getStats(AtkP, ActionType.BA)    → key: "Atk%-BA"
getStats(Dmg, Glacio, BA)        → key: "Dmg Bonus-Glacio-BA"
```

methods: `getStats()` / `setStat()` / `addStat()` / `hasStat()` — ทุกตัวมี 3 overloads

---

## Combat Simulation Pipeline

```
RotationBuilder.add(unit, action, frame, duration)
    ↓ เช็ค isGlobalLocked และ unit.isFree()
    ↓ สร้าง AttackActionEvent / BuffActionEvent
    ↓ schedule → CombatTimeline (IPQ)

CombatTimeline.tick() / runAll()
    ↓ pop event ที่ frame น้อยสุด
    ↓ currentFrame = event.time
    ↓ event.execute()
    ↓ ตรวจ lock state ตาม event type
```

---

## Event Class Hierarchy

```
CombatEvent (abstract)
├── ActionEvent (abstract)        ← ใช้ instanceof เช็ค "เมื่อมีการ action"
│   ├── AttackActionEvent         ← ใช้ instanceof เช็ค "เมื่อมีการโจมตี"
│   └── BuffActionEvent
├── DamageEvent
└── NotificationEvent             ← ChangeToAuto / EndAction / BuffExpired / DebuffExpired
```

---

## Lock System

| สถานการณ์ | `isGlobalLocked` | `unit.actionState` |
|---|---|---|
| ว่าง | `false` | `Free` |
| Manual Action เริ่ม | `true` | `Busy` |
| หลัง ChangeToAuto | `false` | `Busy` |
| หลัง EndAction | `false` | `Free` |

**GlobalLock** — block manual action ใหม่จาก RotationBuilder เท่านั้น (auto event ใน timeline ทำงานได้ปกติ)

---

## หน่วยเวลา
- ใช้ **frame** (integer) — `1 วินาที = 60 frame`
- `CombatTimeline.currentFrame` เก็บ frame ปัจจุบัน

---

## DamageCalculate Formula
```
damage = baseDmg × dmgBonus × critMultiplier × amplify × defMultiplier × resMultiplier × dmgReduction
```
ไฟล์: `Services/Damage/DamageCalculate.ts`
