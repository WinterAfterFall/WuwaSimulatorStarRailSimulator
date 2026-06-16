# WuwaSimulator — Project Overview

## จุดประสงค์
จำลองระบบการต่อสู้ของเกม **Wuthering Waves** เพื่อคำนวณ DPS และ simulate rotation ของตัวละคร
เขียนด้วย **TypeScript** ทั้งหมด (ไม่ build เป็น JS — รันตรงด้วย `tsx` / ทดสอบด้วย `jest` + `ts-jest`)

> **หมายเหตุโครงสร้างโฟลเดอร์:** git repo root อยู่ระดับนอก (`Wuwa Project/WuwaSimulator/`) แต่ตัวโปรเจกต์จริงทั้งหมดอยู่ในโฟลเดอร์ย่อย `WuwaSimulator/` (ที่มีไฟล์นี้และ `package.json`) — รันคำสั่งทั้งหมดจากโฟลเดอร์ย่อยนี้

---

## คำสั่งหลัก (`package.json`)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | รัน simulation ตัวอย่าง — `tsx app/manualBuilder.ts` |
| `npm test` | รัน Jest test ทั้งหมด |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Jest พร้อม coverage report |

- **tsconfig**: `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `types: ["jest", "bun"]`
- มี `bun.lock` (committed) — ใช้ bun หรือ npm ก็ได้ devDeps: `jest`, `ts-jest`, `tsx`, `@types/bun`, `@types/jest`
- ไฟล์ `.js`, `.d.ts`, `dist/`, `node_modules/`, `coverage/` ถูก gitignore — มีแต่ source `.ts` เท่านั้นที่ commit

---

## โครงสร้างโปรเจกต์

```
app/
├── Constants/
│   └── Enum.ts                      # Enum ทั้งหมด (string enums)
│
├── Models/
│   ├── Unit.ts                      # Base class ของทุก unit — stat system (Map-based, 3 overloads)
│   ├── AllyUnit.ts                  # ตัวละครฝ่ายผู้เล่น extends Unit — combat state, rotations, buff/dmg tracking
│   ├── Characters/
│   │   ├── Test1.ts                 # setupTest1(unit) — กำหนด stats + rotations ของตัวละครทดสอบ
│   │   └── Test2.ts                 # setupTest2(unit) — อีกตัวละครทดสอบ
│   └── Combat/
│       ├── Damage.ts                # Data object สำหรับคำนวณ damage (multipliers, element, ฯลฯ)
│       ├── RotationAction.ts        # action ที่ถูก queue ไว้ก่อน schedule (name + execute callback, ยังไม่มี time)
│       └── CombatEvent/
│           ├── CombatEvent.ts       # abstract base ของทุก event ใน timeline (name/time/duration/priority)
│           ├── ActionEvent.ts       # abstract base ของ action ที่ตัวละครทำ (unit/actionType/isManual)
│           ├── AttackActionEvent.ts # action โจมตี — execute() → setBusy + onExecute callback
│           ├── BuffActionEvent.ts   # action buff skill — execute() → setBusy
│           ├── BuffEvent.ts         # abstract base ของ event บัพ/ดีบัพ (มี target)
│           ├── BuffStartEvent.ts    # บัพเริ่มมีผล (execute ยังว่าง — stub)
│           ├── BuffEndEvent.ts      # บัพหมดผล (execute ยังว่าง — stub)
│           ├── DamageEvent.ts       # ความเสียหาย ณ frame — execute() จะเรียก DamageCalculate (ยัง TODO)
│           └── NotificationEvent.ts # signal event (ChangeToAuto / EndAction / Buff/DebuffExpired)
│
├── Services/
│   └── Damage/
│       └── DamageCalculate.ts       # สูตรคำนวณ damage (WuWa formula) — calculateDamage(damage, target)
│
├── Simulator/
│   ├── CombatTimeline.ts            # จัดการ event ด้วย IPQ, currentFrame, lock state
│   ├── RotationBuilder.ts           # fluent builder → สร้าง Queue<RotationAction>
│   └── RotationDirector.ts          # ขับ setup/loop queue → execute action → tick timeline
│
├── Utils/
│   ├── queue.ts                     # FIFO Queue (object-map backed) — O(1) ทุก op, มี rotate()
│   ├── priorityQueue.ts             # Binary min-heap (PQ<T>) — push/pop O(log n), delete by predicate
│   └── IndexedPriorityQueue.ts      # PQ + positionMap → update/delete/has ด้วยชื่อ O(log n)
│
├── Test/
│   ├── automated/Utils/             # ✅ Jest tests ที่ใช้งานได้ (import path ถูกต้อง)
│   │   ├── Queue.test.ts
│   │   ├── PriorityQueue.test.ts
│   │   └── IndexedPriorityQueue.test.ts
│   ├── Utils/                       # ⚠️ legacy duplicate — import path ผิด (`../Utils/...`) ใช้ไม่ได้
│   ├── manual/                      # รันด้วยมือ (tsx) — scratch tests
│   │   ├── 1-unit.ts / 2-hello.ts / 3-advanced-ipq.ts / 4-queue.ts
│   └── queue.ts
│
└── manualBuilder.ts                 # Entry point ตัวอย่าง — setup 2 units, รวม rotation, รัน RotationDirector
```

---

## Enum หลัก (`Constants/Enum.ts`)
ทุกตัวเป็น **string enum** (value = string ไม่ใช่ตัวเลข)

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
Stats เก็บใน `Map<string, number>` โดยสร้าง key จาก enum **value** (string):

```
getStats(AtkP)                    → key: "Atk%"
getStats(AtkP, ActionType.BA)     → key: "Atk%-BA"
getStats(Dmg, Glacio, BA)         → key: "Dmg Bonus-Glacio-BA"
```

- generateKey: 1 arg → `st` / 2 args → `st-x` / 3 args → `st-element-action`
- methods: `getStats()` / `setStat()` / `addStat()` / `hasStat()` — แต่ละตัวมี **3 overloads** ตามจำนวน dimension
- constructor รับ `Partial<Record<StatsType, number>>` ได้ (set stat แบบ flat ตอนสร้าง)
- lifecycle: `isAlive()`, `setDead()`

### AllyUnit (extends Unit)
เพิ่ม combat-specific state:
- **state**: `isOnField`, `actionState` (+ helper `isFree()`/`setBusy()`/`setFree()`)
- **base stats**: `baseAtk`, `baseHp`, `baseDef`
- **info**: `elementType`, `weaponType`, `resonanceChain`
- **energy / hp**: `energy`, `maxEnergy`, `currentHP`, `currentShield`
- **rotations**: `Map<string, (timeline) => Queue<RotationAction>>` — แต่ละ rotation เป็น factory ที่รับ timeline แล้วคืน queue
- **tracking**: `stacks`, `buffNote`, `buffCheck`, `dmgRecord`, `maxDmgRecord` (ทั้งหมด `Map`)
- `TimelineRef` = structural type (`schedule()` + `currentFrame`) ใช้เลี่ยง circular import กับ `CombatTimeline`

---

## Event Class Hierarchy
ใช้ `instanceof` แยกประเภท event ตอน tick

```
CombatEvent (abstract)            — name, time, duration, priority, execute()
├── ActionEvent (abstract)        — + unit, actionType, isManual   ← เช็ค "มีการ action"
│   ├── AttackActionEvent         — execute() → unit.setBusy() + onExecute callback
│   └── BuffActionEvent           — execute() → unit.setBusy()
├── BuffEvent (abstract)          — + target                       ← เช็ค "บัพเริ่ม/จบ"
│   ├── BuffStartEvent            — execute() (stub)
│   └── BuffEndEvent              — execute() (stub)
├── DamageEvent                   — + damage, target (execute → DamageCalculate, ยัง TODO)
└── NotificationEvent             — + notifyType, unit (signal-only, ไม่รัน logic เอง)
```

---

## Combat Simulation Pipeline

```
1. setupTestX(unit)            กำหนด base stats + ลง rotations (factory) ลง unit.rotations
2. RotationBuilder              .add(name, execute).add(...).build() → Queue<RotationAction>
3. RotationDirector(timeline, setupQueue, loopQueue, maxLoops)
       .run()
        ├── step(): ถ้า !isGlobalLocked → nextAction() → action.execute()
        │           (execute จะ schedule AttackActionEvent + NotificationEvent ลง timeline)
        │           แล้ว tick() วนจน global lock ปลด หรือ timeline ว่าง
        ├── nextAction(): drain setupQueue ก่อน → จากนั้น rotate() loopQueue จนครบ maxLoops
        └── timeline.runAll() drain event ที่เหลือ

CombatTimeline.tick()
        ├── pop event ที่ (time น้อยสุด, priority เป็น tie-breaker)
        ├── currentFrame = event.time
        ├── event.execute()
        └── จัดการ lock ตามชนิด event (ดูตารางด้านล่าง)
```

- **setupQueue** = รันครั้งเดียวตอนเปิดฉาก (เช่น Burst), **loopQueue** = วนซ้ำตาม `maxLoops` (เช่น Standard)
- `manualBuilder.ts` แสดงตัวอย่าง merge rotation ของหลาย unit เข้า queue เดียว

---

## Lock System

| สถานการณ์ | `isGlobalLocked` | `unit.actionState` |
|---|---|---|
| ว่าง | `false` | `Free` |
| Manual Action เริ่ม (ActionEvent.isManual) | `true` | `Busy` |
| หลัง `ChangeToAuto` | `false` | `Busy` |
| หลัง `EndAction` | `false` | `Free` (เรียก `unit.setFree()`) |

**GlobalLock** บล็อกเฉพาะการดึง action ใหม่จาก `RotationDirector` (auto event ใน timeline ยังทำงานต่อได้ปกติ)

---

## หน่วยเวลา
- ใช้ **frame** (integer) — `1 วินาที = 60 frame` (ค่าคงที่ `F = 60` ใน `manualBuilder.ts`)
- `CombatTimeline.currentFrame` เก็บ frame ปัจจุบัน
- IPQ เรียง event: `time` น้อยออกก่อน → ถ้าเท่ากันใช้ `priority` น้อยออกก่อน

---

## DamageCalculate Formula (`Services/Damage/DamageCalculate.ts`)
```
damage = base × dmgBonus × crit × amp × def × res × reduction
```
| ส่วน | สูตร |
|---|---|
| base | `atk·m.atk + hp·m.hp + def·m.def + m.const` (atk/hp/def รวม %+flat แล้ว) |
| dmgBonus | `1 + Σ(Dmg bonus ตาม element/action)` |
| crit | `1 + min(CR,1)·CD` (ถ้า `isCritable`) |
| amp | `1 + Amplify` |
| def | `800 / (800 + effectiveDef)` (WuWa def formula) |
| res | `1 - max(0, elemRed - resPen)` |
| reduction | `max(0, 1 - DmgRed)` |

---

## ข้อควรระวัง / Known issues
- **field mismatch**: `Damage.ts` ประกาศ field ชื่อ `attackTypeList` แต่ `DamageCalculate.ts` อ่าน `damage.actionTypeList` → ต้อง rename ให้ตรงกันก่อน damage calc จะทำงาน
- `DamageEvent.execute()` ยังเป็น TODO (ยังไม่เรียก `calculateDamage` / ไม่บันทึกลง `dmgRecord`)
- `BuffStartEvent` / `BuffEndEvent` execute() ยังว่าง
- `Test/Utils/` เป็น duplicate เก่าที่ import path ผิด — ใช้ `Test/automated/Utils/` แทน
- ยังไม่มีตัวละครจริง (Rover, Jiyan ฯลฯ) — มีแค่ `Test1`/`Test2` เป็น scaffolding
```
