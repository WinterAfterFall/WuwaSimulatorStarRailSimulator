# WuwaSimulator — Project Overview

## จุดประสงค์
จำลองระบบการต่อสู้ของเกม **Wuthering Waves** เพื่อคำนวณ DPS และ simulate rotation ของตัวละคร
เขียนด้วย **TypeScript** ทั้งหมด (ไม่ build เป็น JS — รันตรงด้วย `tsx` / ทดสอบด้วย `jest` + `ts-jest`)

> **หมายเหตุโครงสร้างโฟลเดอร์:** git repo root อยู่ระดับนอก (`Wuwa Project/WuwaSimulator/`) แต่ตัวโปรเจกต์จริงทั้งหมดอยู่ในโฟลเดอร์ย่อย `WuwaSimulator/` (ที่มีไฟล์นี้และ `package.json`) — รันคำสั่งทั้งหมดจากโฟลเดอร์ย่อยนี้

---

## คำสั่งหลัก (`package.json` + `jest.config.js`)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | รัน simulation ตัวอย่าง — `tsx app/manualBuilder.ts` |
| `npm test` | รัน Jest test ทั้งหมด |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Jest พร้อม coverage report |

- **tsconfig**: `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `types: ["jest", "bun"]`
- **jest.config.js**: ใช้ `ts-jest` preset, `testMatch: **/Test/automated/**/*.test.ts` (ไม่รัน legacy `Test/Utils/`)
- devDeps: `jest@^29`, `ts-jest@^29`, `tsx`, `@types/bun`, `@types/jest`
  - **หมายเหตุ**: ts-jest รองรับแค่ jest 29.x — ถ้า upgrade jest ต้องรอ ts-jest 30.x
- ไฟล์ `.js`, `.d.ts`, `dist/`, `node_modules/`, `coverage/` ถูก gitignore — มีแต่ source `.ts` เท่านั้นที่ commit

---

## โครงสร้างโปรเจกต์

```
app/
├── Constants/
│   └── Enum.ts                      # Enum ทั้งหมด (string enums) — StatsType มี comment กำกับ Ally/Enemy/Both ต่อตัว
│
├── Models/
│   ├── Unit.ts                      # Base class ของทุก unit — stat system (Map-based, 3 overloads) + defaultStats/reset
│   ├── AllyUnit.ts                  # ตัวละครฝ่ายผู้เล่น extends Unit — combat state, rotations, buff/dmg tracking, TimelineRef
│   ├── EnemyUnit.ts                 # ศัตรู extends Unit — level, baseElemRed, position, debuff tracking, dmgRecord
│   ├── Characters/
│   │   ├── Test1.ts                 # setupTest1(unit) — กำหนด stats + rotations ของตัวละครทดสอบ
│   │   ├── Test2.ts                 # setupTest2(unit) — อีกตัวละครทดสอบ
│   │   └── Support/
│   │       └── Mornye.ts            # ตัวละครจริงตัวแรก — base stats + duration/damage-frame consts + rotation "BA Combo" (BA1-3 ครบ)
│   └── Combat/
│       ├── Damage.ts                # Data object — target เจาะจง (EnemyUnit[]) หรือ SkillRange (กรองจาก battleField.enemies เอง ไม่ต้องแนบ enemies list)
│       ├── RotationAction.ts        # action ที่ถูก queue ไว้ก่อน schedule (name + execute callback, ยังไม่มี time)
│       └── CombatEvent/
│           ├── CombatEvent.ts       # base ของทุก event — execute เป็น field `() => void` (default no-op) ไม่ใช่ abstract method แล้ว เปลี่ยนค่าได้ทีหลัง (`event.execute = ...`) duration เป็น optional
│           ├── ActionEvent.ts       # abstract base ของ action ที่ตัวละครทำ (unit/actionType/isManual)
│           ├── AttackActionEvent.ts # action โจมตี — 2 overload (มี/ไม่มี duration), ถ้ามี duration+timeline จะ auto-schedule EndAction เอง
│           ├── BuffActionEvent.ts   # action buff skill — ตั้ง execute = setBusy ใน constructor
│           ├── BuffEvent.ts         # abstract base ของ event บัพ/ดีบัพ (มี target)
│           ├── BuffStartEvent.ts    # บัพเริ่มมีผล (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── BuffEndEvent.ts      # บัพหมดผล (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── DamageEvent.ts       # ความเสียหาย ณ frame — ถ้าส่ง triggerBus มา execute จะเรียก calculateDamage() จริง (print ในตัวอยู่แล้ว)
│           └── NotificationEvent.ts # signal event (ChangeToAuto / EndAction / Buff/DebuffExpired)
│
├── Services/
│   ├── Damage/
│   │   └── DamageCalculate.ts       # สูตรคำนวณ damage (WuWa formula) — calculateDamage(damage, triggerBus), dmgBonus รวมทั้ง attacker+target
│   └── Combat/
│       ├── EnergyService.ts         # increaseEnergy(unit, amount, triggerBus, actionType?) — จุดเดียวที่ mutate energy
│       └── EndActionService.ts      # notifyEndAction(timeline, duration, actionName?) — schedule NotificationEvent(EndAction) ให้ timeline.onFieldChar เอง
│
├── Simulator/
│   ├── CombatTimeline.ts            # จัดการ event ด้วย IPQ, currentFrame, lock state, ถือ TriggerBus กลาง — ไม่มี allies/enemies แล้ว เข้าถึงผ่าน battleField โดยตรง
│   ├── BattleField.ts               # global singleton `battleField.{allies,enemies}` (ES module = singleton) + createEnemy(name) สร้าง+push ให้เลย
│   ├── RotationBuilder.ts           # fluent builder → สร้าง Queue<RotationAction>
│   ├── RotationDirector.ts          # ขับ setup/loop queue → execute action → tick timeline
│   └── TriggerBus.ts                # pub/sub กลาง — ตัวละคร register listener ต่อ TriggerEvent แล้ว engine emit ตอน trigger จริง
│
├── Utils/
│   ├── queue.ts                     # FIFO Queue (object-map backed) — O(1) ทุก op, มี rotate()
│   ├── priorityQueue.ts             # Binary min-heap (PQ<T>) — push/pop O(log n), delete by predicate
│   └── IndexedPriorityQueue.ts      # PQ + positionMap → update/delete/has ด้วยชื่อ O(log n)
│
├── Test/
│   ├── automated/                   # ✅ Jest tests ที่ใช้งานได้ (ครอบคลุมโดย jest.config.js) — 8 suite / 100 tests
│   │   ├── Utils/                   #   Queue / PriorityQueue / IndexedPriorityQueue
│   │   ├── Simulator/               #   TriggerBus.test.ts
│   │   ├── Services/                #   DamageCalculate.test.ts, EnergyService.test.ts
│   │   └── Models/                  #   EnemyUnit.test.ts, Damage.test.ts (รวม SkillRange ผ่าน battleField.enemies)
│   ├── Utils/                       # ⚠️ legacy duplicate — import path ผิด (`../Utils/...`) ใช้ไม่ได้
│   ├── manual/                      # รันด้วยมือ (tsx) — scratch tests + ไฟล์ trace .html (เอกสาร static เก่า ไม่ sync กับโค้ดปัจจุบันแล้ว)
│   │   ├── 1-unit.ts / 2-hello.ts / 3-advanced-ipq.ts / 4-queue.ts
│   │   ├── manualBuilder-trace.html # ⚠️ เอกสารเก่า ยังโชว์ execute() แบบ method — ล้าสมัยหลัง refactor เป็น field
│   │   └── void-fn-problem.html     # ⚠️ เอกสารเก่าเช่นกัน
│   └── queue.ts
│
├── extra/substats/                  # เครื่องมือแยกต่างหาก ไม่เกี่ยวกับ combat sim — คำนวณความน่าจะเป็น tier ของ Echo substat
│   ├── SubstatData.ts                #   ตาราง exactChance 4 กลุ่ม (main/crit/flatAtk/flatDef)
│   └── SubstatProbability.ts         #   getExactChance/getSurvivalChance/getTuneUpChance/buildTuneDecisionMatrix
├── substatLauncher.ts               # รัน `npx tsx app/substatLauncher.ts` — สาธิตเครื่องมือ substat ด้านบน
│
└── manualBuilder.ts                 # Entry point ตัวอย่าง — setup 2 units, รวม rotation, รัน RotationDirector (Test1/Test2 เท่านั้น ไม่ได้ใช้ Mornye/battleField)
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
| `TriggerEvent` | `EnergyIncrease` (เพิ่ม event ใหม่ที่นี่ + payload คู่กันใน `TriggerEventMap`) |
| `StatsType` | `AtkP`, `FlatAtk`, `Hp`, `FlatHp`, `DefP`, `FlatDef`, `CR`, `CD`, `Dmg`, `Amp`, `Sp`, `DefShred`, `DefRed`, `ResRed`, `ResPen`, `DmgRed`, `ElemRed`, `TbBoost`, `HealBonus`, `IncHealBonus` — แต่ละตัว comment กำกับว่า Ally/Enemy/Both ใช้จริง (อ้างอิง `DamageCalculate.ts`); `TbBoost`/`HealBonus`/`IncHealBonus` ยังไม่ต่อสายเข้าสูตรไหน — เพิ่มไว้เฉยๆ; `ALLY_STATS`/`ENEMY_STATS` (array แยก) เป็น dead export ไม่มีใครเรียกใช้ตอนนี้ |
| `ActionType` | `None`, `BA`, `HA`, `Skill`, `Ult`, `Echo`, `Intro`, `Outro`, `TB` |
| `ElementType` | `None`, `Glacio`, `Fusion`, `Electro`, `Aero`, `Spectro`, `Havoc` |
| `WeaponType` | `None`, `Broadblade`, `Sword`, `Pistols`, `Gauntlets`, `Rectifier` |
| `EnemyPosition` | `Vanguard="0"`, `Midrange="1"`, `Rearguard="2"`, `OutOfRange="3"` |
| `MultiplierType` | `Atk="atk"`, `Hp="hp"`, `Def="def"`, `Const="const"` |
| `SkillRange` | `None="0"`, `Contact="1"`, `Midrange="2"`, `Ranged="3"`, `Global="999"` |

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

### Default Stats / Reset (`Unit.ts`)
- `defaultStats: Map<string, number>` — แยกจาก `stats`, ไม่ auto-populate ตอนสร้าง (ต้อง set เอง)
- `getDefaultStats()`/`setDefaultStat()`/`addDefaultStat()`/`hasDefaultStat()` — mirror overload เดียวกับ `stats` ทุกตัว แค่อ่าน/เขียน `defaultStats` แทน
- `initDefaultStats()` — วน key ที่มีอยู่จริงใน `stats` (ไม่ใช่ทุก StatsType) แล้วเซ็ตกลับเป็นค่าใน `defaultStats` ของ key เดียวกัน (key ไหนไม่มีใน `defaultStats` ใส่ 0 แทน) — ใช้สำหรับ reset ตัวละครกลับค่าเดิมก่อนเริ่ม simulate รอบใหม่ (ยังไม่มีใครเรียกใช้จริงในโค้ด production ตอนนี้)

### AllyUnit (extends Unit)
เพิ่ม combat-specific state:
- **state**: `isOnField`, `actionState` (+ helper `isFree()`/`setBusy()`/`setFree()`)
- **base stats**: `level` (default 90), `baseAtk`, `baseHp`, `baseDef`
- **info**: `elementType`, `weaponType`, `resonanceChain`
- **energy / hp**: `energy`, `maxEnergy`, `currentHP`, `currentShield`
- **rotations**: `Map<string, (timeline) => Queue<RotationAction>>` — แต่ละ rotation เป็น factory ที่รับ timeline แล้วคืน queue
- **tracking**: `stacks`, `buffNote`, `buffCheck`, `dmgRecord`, `maxDmgRecord` (ทั้งหมด `Map`)
- `TimelineRef` = structural type ใช้เลี่ยง circular import กับ `CombatTimeline` — มี `schedule()`, `currentFrame`, `triggerBus`, `onFieldChar` (ตรงกับ field จริงของ `CombatTimeline` แบบ structural — เพิ่ม field ใหม่ที่ rotation ต้องใช้ที่นี่ก่อนเสมอ) — **ไม่มี `allies`/`enemies` แล้ว** rotation ที่ต้องอ่าน roster ให้ `import { battleField } from "../../Simulator/BattleField"` แล้วอ่าน `battleField.allies`/`battleField.enemies` ตรงๆ แทน

### EnemyUnit (extends Unit)
- **level** (default 90) — ใช้คำนวณ DEF: `8×level + 792`
- **baseElemRed** (default 0) — resistance ตั้งต้นของมอน, บวกเพิ่มจาก stat system ได้
- **position**: `EnemyPosition`
- **tracking**: `debuffStacks`, `debuffNote`, `debuffCheck`, `dmgRecord`, `maxDmgRecord`

---

## Event Class Hierarchy
ใช้ `instanceof` แยกประเภท event ตอน tick

```
CombatEvent (abstract)            — name, time, duration?, priority, execute: () => void
├── ActionEvent (abstract)        — + unit, actionType, isManual   ← เช็ค "มีการ action"
│   ├── AttackActionEvent         — execute ตั้งเป็น setBusy + onExecute?.() + auto-schedule EndAction (ถ้ามี duration+timeline)
│   └── BuffActionEvent           — execute ตั้งเป็น setBusy
├── BuffEvent (abstract)          — + target                       ← เช็ค "บัพเริ่ม/จบ"
│   ├── BuffStartEvent            — ใช้ default no-op execute (ยังไม่มี logic)
│   └── BuffEndEvent              — ใช้ default no-op execute (ยังไม่มี logic)
├── DamageEvent                   — + damage, target, (onExecute?, triggerBus?) — ถ้ามี triggerBus execute จะเรียก calculateDamage() จริง
└── NotificationEvent             — + notifyType, unit (ใช้ default no-op execute — signal-only ให้ CombatTimeline.tick() อ่าน notifyType เอง)
```

**`execute` เป็น field ไม่ใช่ abstract method แล้ว** — `CombatEvent.execute: () => void = () => {}` (default no-op) ทุก subclass ตั้งค่าจริงด้วย `this.execute = () => {...}` ใน constructor แทนการ override method เดิม ผลคือ **เปลี่ยนค่าได้ทีหลังต่อ instance** เหมือนตัวแปรทั่วไป เช่น `event.execute = () => {...}` แก้แค่ตัวนั้นตัวเดียว ไม่กระทบ instance อื่นของ class เดียวกันเลย (`CombatTimeline.tick()` เรียก `event.execute()` เหมือนเดิมทุกอย่าง เพราะ syntax เรียก field-ที่เป็น-function กับเรียก method เหมือนกัน)

**`duration` เป็น optional** (`number | undefined`) ทั้งสาย (`CombatEvent`/`ActionEvent`) — "-" (ไม่ใส่) ได้ ถ้าไม่ใส่ `AttackActionEvent` จะไม่ auto-schedule EndAction ให้

**`AttackActionEvent` มี 2 constructor overload**: มี/ไม่มี `duration` — ถ้าใส่ `duration` + `timeline` (พารามิเตอร์สุดท้าย) มาด้วย `execute()` จะเรียก `notifyEndAction(timeline, duration)` ([EndActionService.ts](app/Services/Combat/EndActionService.ts)) ให้อัตโนมัติ ไม่ต้องเขียน `NotificationEvent(EndAction)` มือเองอีก (ตัวอย่างใน `Mornye.ts`) — `Test1.ts`/`Test2.ts` เก่ายังเรียกแบบไม่ส่ง `timeline` เข้าไป จึงยังต้อง schedule `NotificationEvent` มือเหมือนเดิม (ไม่เกิดการ schedule ซ้ำ)

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

## TriggerBus — Passive/Event Hook System (`Simulator/TriggerBus.ts`)

รูปแบบ pub/sub กลาง ปรับมาจากแนวคิด trigger-list ของ StarRailSimulator (`When_Energy_Increase_List` +
`allEventWhenEnergyIncrease`): ตัวละครแต่ละตัว **register callback ของตัวเอง** ลง list กลางตอน setup
แล้วทุกครั้งที่ action จริงเกิด event นั้นขึ้น engine จะวน emit ให้ listener ทุกตัวที่ลงทะเบียนไว้ทำงาน
— แทนที่จะ hardcode logic เฉพาะตัวไว้ตรงจุดเกิด event

```
CombatTimeline.triggerBus : TriggerBus                    ← instance เดียวต่อ 1 battle
    .on(event, callback, priority?)                       ← ลงทะเบียน listener (มากไปน้อยออกก่อน, เท่ากัน = ตามลำดับ register)
    .emit(event, ctx)                                      ← engine เรียกตอน action จริง trigger event นั้น
```

- `TriggerEventMap` (ใน `TriggerBus.ts`) map แต่ละ `TriggerEvent` ไปยัง payload/context ของมัน — เพิ่ม event ใหม่ต้อง
  เพิ่มทั้ง `TriggerEvent` enum (`Constants/Enum.ts`) และ entry ใน `TriggerEventMap` คู่กัน
- `AllyUnit.rotations` factory รับ `TimelineRef` ซึ่งมี `triggerBus` ติดมาด้วย (structural type, `import type` เลี่ยง
  circular import กับ `AllyUnit` ↔ `TriggerBus`) — ตัวละคร register passive ได้จากใน rotation setup
- **energy gain ทั้งหมดต้องผ่าน `EnergyService.increaseEnergy(unit, amount, triggerBus, actionType?)`** — ฟังก์ชันนี้
  `emit(TriggerEvent.EnergyIncrease, { unit, amount, actionType })` **ก่อน** clamp กับ `maxEnergy` (listener เห็นค่า
  ดิบที่ "จะ" เพิ่ม ก่อนโดนตัด จึงตรวจ overflow ได้ เช่น passive ที่แปลง energy ส่วนเกินเป็นบัพอื่น)
- `DamageCalculate.calculateDamage(damage, triggerBus)` เรียก `increaseEnergy` แทนการ mutate `attacker.energy` ตรงๆ —
  ต้องส่ง `triggerBus` (จาก `CombatTimeline.triggerBus`) เข้าไปเสมอ

---

## Global Battle State (`Simulator/BattleField.ts`)
- `battleField: { allies: AllyUnit[]; enemies: EnemyUnit[] }` — global singleton (ES module import ที่ไหนก็ได้ object เดียวกันเสมอ) เก็บ ally/enemy ทั้งหมดที่อยู่ในสนามตอนนี้
- `CombatTimeline` **ไม่มี** `allies`/`.enemies` (ไม่มี getter proxy แล้ว) — ที่ไหนอยากได้ roster ให้ import `battleField` แล้วอ่านตรงๆ (`TimelineRef` ก็ตัด 2 field นี้ออกไปด้วยเหตุผลเดียวกัน)
- `createEnemy(name: string): EnemyUnit` — สร้าง `EnemyUnit` (stats พื้นฐาน default อยู่แล้วใน class) แล้ว push เข้า `battleField.enemies` ให้เลย คืนค่า instance ที่สร้างกลับมา
- `Damage`'s SkillRange overload (`new Damage(attacker, name, attackType, range)`) **อ่าน `battleField.enemies` เองภายใน ไม่ต้องรับ `enemies` list เข้ามาแล้ว** — กรองด้วย `enemies.filter(e => Number(e.position) < Number(range))` เหมือนเดิม แค่ที่มาของ enemies list เปลี่ยนจาก parameter เป็น global
- ⚠️ ยังไม่มีจุดไหนใน `manualBuilder.ts` เรียก `createEnemy()`/push เข้า `battleField` เลย — Test1/Test2 ไม่ได้ใช้ `Damage`/`DamageEvent` เลย (แค่ log)
- ⚠️ `battleField` ไม่ถูก reset ระหว่างรัน simulate หลายรอบในโปรเซสเดียว — ถ้าจะทำ "รันซ้ำเทียบ substat" ตามที่คุยไว้ก่อนหน้า ต้อง clear `battleField.allies`/`.enemies` เองก่อนแต่ละรอบด้วย

---

## DamageCalculate Formula (`Services/Damage/DamageCalculate.ts`)
```
damage = base × dmgBonus × crit × amp × def × res × reduction
```
| ส่วน | สูตร |
|---|---|
| base | `atk·m.atk + hp·m.hp + def·m.def + m.const` (atk/hp/def รวม %+flat แล้ว) |
| dmgBonus | `1 + attacker.dmgBonus + target.dmgBonus` (รวมทั้ง 2 ฝั่งแบบ additive เหมือน `amp`) |
| crit | `1 + min(CR,1)·CD` (ถ้า `isCritable`) |
| amp | `1 + Amplify` |
| enemy DEF | `8×LVL_enemy + 792` แล้วลด `× (1−DefRed)` (DefRed = debuff บน enemy ลด DEF ก่อนสูตร) |
| def | `(800+8×LVL_attacker) / (800+8×LVL_attacker + DEF_enemy×(1−DefShred))` |
| res | piecewise โดย `RES = elemRed − resPen`: `RES<0 → 1−RES/2` / `0≤RES<0.8 → 1−RES` / `RES≥0.8 → 1/(1+5×RES)` |
| reduction | `max(0, 1 − DmgRed)` |

---

## ข้อควรระวัง / Known issues
- `DamageEvent` เรียก `calculateDamage()` ได้แล้ว **แต่ต้องส่ง `triggerBus` เข้า constructor เอง** (parameter สุดท้าย) ถ้าไม่ส่งจะ no-op เงียบๆ (ไม่ error แต่ก็ไม่คำนวณอะไรเลย) — ยังไม่บันทึกผลลงใน `attacker.dmgRecord` (แค่ print เฉยๆ ผ่าน `calculateDamage`)
- `BuffStartEvent` / `BuffEndEvent` ยังใช้ default no-op execute จาก `CombatEvent` (ยังไม่มี logic เพิ่ม/ลบ stat จริง)
- `Test/Utils/` เป็น duplicate เก่าที่ import path ผิด — ใช้ `Test/automated/Utils/` แทน
- `Mornye` เป็นตัวละครจริงตัวแรก (base stats + default stats + rotation "BA Combo" ครบ) แต่หลาย field ยังเป็น placeholder `0` (EBA1-3, HA Geopotential Shift, HA Inversion, Ult ทั้ง duration และ damage frame) รอข้อมูลจริง — `Test1`/`Test2` ยังเป็น scaffolding เดิม ไม่มี passive ที่ register กับ `TriggerBus` จริง
- `manualBuilder.ts` ยังใช้แค่ `Test1`/`Test2` ไม่ได้เปลี่ยนไปใช้ `Mornye` หรือ `battleField`/`createEnemy` เลย — ถ้าจะรัน Mornye จริงต้องประกอบ `manualBuilder` ใหม่เอง (ดูตัวอย่างการรันใน scratchpad ระหว่างพัฒนา)
- `ALLY_STATS`/`ENEMY_STATS` ใน `Enum.ts` เป็น dead export (เคยตั้งใจใช้ populate `defaultStats` อัตโนมัติตอนสร้าง `AllyUnit`/`EnemyUnit` แต่ถูกยกเลิกไปแล้ว)
- เอกสาร trace แบบ static ใน `Test/manual/*.html` (`manualBuilder-trace.html`, `void-fn-problem.html`) ล้าสมัยแล้วหลัง refactor `execute` เป็น field — ไม่ใช่โค้ดที่รันจริง แค่เอกสารประกอบเก่า
