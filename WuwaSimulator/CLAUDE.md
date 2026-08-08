# WuwaSimulator — Project Overview

## จุดประสงค์
จำลองระบบการต่อสู้ของเกม **Wuthering Waves** เพื่อคำนวณ DPS และ simulate rotation ของตัวละคร
เขียนด้วย **TypeScript** ทั้งหมด (ไม่ build เป็น JS — รันตรงด้วย `tsx` / ทดสอบด้วย `jest` + `ts-jest`)

> **หมายเหตุโครงสร้างโฟลเดอร์:** git repo root อยู่ระดับนอก (`Wuwa Project/WuwaSimulator/`) แต่ตัวโปรเจกต์จริงทั้งหมดอยู่ในโฟลเดอร์ย่อย `WuwaSimulator/` (ที่มีไฟล์นี้และ `package.json`) — รันคำสั่งทั้งหมดจากโฟลเดอร์ย่อยนี้

---

## หลักการออกแบบ — อ่านง่ายและแก้ทีหลังได้ มาก่อนเสมอ

> **เป้าหมายลำดับแรกคือโค้ดที่คนอ่านแล้วเข้าใจทันที และแก้ทีหลังได้โดยไม่กลัวพัง**
> ความเร็วและความ "ถูกหลัก" ทางสถาปัตยกรรม เป็นเรื่องรอง — optimize ทีหลังเมื่อมีหลักฐานว่าช้าจริง

สิ่งที่หลักการนี้แปลว่าเวลาต้องตัดสินใจ

| เจอทางเลือกแบบนี้ | ให้เลือก |
|---|---|
| แยกคลาสให้ layering สวย vs รวมไว้ก้อนเดียวที่อ่านรวดเดียวจบ | **รวม** ถ้าทุกที่ที่ใช้ตัวหนึ่งก็ต้องใช้อีกตัวอยู่แล้ว การแยกที่ไม่มีใครได้ประโยชน์วันนี้ = ต้นทุนเปล่า |
| เช็คประเภทเพื่อจัดรูป argument vs ส่งเหมือนกันหมดทุกครั้ง | **ส่งเหมือนกันหมด** — signature เดียวกันทั้งหมด ทำให้ caller ไม่ต้องรู้จัก subclass และเพิ่มชนิดใหม่ไม่ต้องกลับมาแก้ที่เดิม |
| เพิ่ม abstraction เผื่ออนาคต vs เขียนตรง ๆ ก่อน | **เขียนตรง ๆ** (YAGNI) รอจนมีคนใช้จริงค่อยยก |
| optimize ให้เร็วขึ้น vs เขียนให้อ่านง่าย | **อ่านง่าย** จนกว่าจะวัดแล้วพบว่าช้าจริงตรงจุดนั้น |

**สิ่งที่ห้ามแลกทิ้งเพื่อความ simple** — สองข้อนี้คือสิ่งที่ทำให้ "แก้ทีหลังได้" เป็นจริง ไม่ใช่ของฟุ่มเฟือย

1. **test ต้องเขียวเสมอ** และงานใหม่ทุกชิ้นเขียน test ก่อน (ดูรอบการทำงานใน `docs/superpowers/`) — test คือสิ่งเดียวที่ทำให้กล้ารื้อโครงทีหลัง
2. **ห้าม state รั่วข้ามรอบ simulate** — ไม่มี global mutable, ทุกอย่างผูกกับ instance ที่มีอายุชัดเจน (เหตุผลเต็มอยู่ใน `docs/superpowers/summaries/2026-08-07-battlefield-instance-summary.md`)

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
├── Data/                            # ข้อมูลตัวละคร/ไอเทม (แยกออกจาก Models — ไม่ใช่ engine code)
│   ├── Characters/
│   │   ├── Test1.ts                 # setupTest1(unit) — กำหนด stats + rotations ของตัวละครทดสอบ (import Models/AllyUnit, Models/Combat/... แบบ "../../Models/...")
│   │   ├── Test2.ts                 # setupTest2(unit) — อีกตัวละครทดสอบ
│   │   └── Support/
│   │       └── Mornye.ts            # ตัวละครจริงตัวแรก — base stats + ค่าท่าแบบ MoveData ตัวเดียวต่อท่า (BA1-3, EBA1-3, ESkill, HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME, HA_INVERSION_DAMAGE_FRAME, Intro, Ult) + rotation "BA Combo" (BA1-3 ครบ)
│   └── Items/                       # ยังว่าง — เตรียมไว้สำหรับข้อมูลไอเทม (echo/weapon/ฯลฯ)
│
├── Models/
│   ├── Unit.ts                      # Base class ของทุก unit — stat system (Map-based, 3 overloads) + defaultStats/reset
│   ├── AllyUnit.ts                  # ตัวละครฝ่ายผู้เล่น extends Unit — combat state, rotations, buff/dmg tracking, TimelineRef
│   ├── EnemyUnit.ts                 # ศัตรู extends Unit — level, baseElemRed, position, debuff tracking, dmgRecord
│   └── Combat/
│       ├── Damage.ts                # Data object ล้วน — รับ target เป็น EnemyUnit|EnemyUnit[] เท่านั้น ไม่ import อะไรจาก Simulator/
│       ├── MoveData.ts              # interface รวมค่าท่า 1 ท่า — duration/damageFrame/mtpr/type + optional energyGain/concento/autoStartFrame
│       ├── RotationAction.ts        # action ที่ถูก queue ไว้ก่อน schedule (name + execute callback, ยังไม่มี time)
│       └── CombatEvent/
│           ├── CombatEvent.ts       # base ของทุก event — execute เป็น field `() => void` (default no-op) ไม่ใช่ abstract method แล้ว เปลี่ยนค่าได้ทีหลัง (`event.execute = ...`) duration เป็น optional
│           ├── ActionEvent.ts       # abstract base ของ action ที่ตัวละครทำ (unit/actionType/isManual/autoStartFrame) — ถ้ามี duration+timeline auto-schedule EndAction, ถ้ามี autoStartFrame+timeline auto-schedule ChangeToAuto — constructor internal เท่านั้น เรียกผ่าน static factory ของ subclass
│           ├── AttackActionEvent.ts # action โจมตี — constructor private, สร้างผ่าน .manual(...)/.auto(...) เท่านั้น (ดู "static factory" ด้านล่าง) — .manual() throw ถ้าไม่มีทั้ง duration และ autoStartFrame
│           ├── BuffActionEvent.ts   # action buff skill — pattern เดียวกับ AttackActionEvent ทุกอย่าง (.manual()/.auto()) ตั้ง execute = setBusy ใน constructor
│           ├── BuffEvent.ts         # abstract base ของ event บัพ/ดีบัพ (มี target)
│           ├── BuffStartEvent.ts    # บัพเริ่มมีผล — มี duration? field ของตัวเอง (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── BuffEndEvent.ts      # บัพหมดผล — ไม่มี duration (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── DamageEvent.ts       # ความเสียหาย ณ frame — ถ้าส่ง triggerBus มา execute จะเรียก calculateDamage() จริง (print ในตัวอยู่แล้ว)
│           └── NotificationEvent.ts # signal event (ChangeToAuto / EndAction / Buff/DebuffExpired)
│
├── Services/
│   ├── Damage/
│   │   └── DamageCalculate.ts       # สูตรคำนวณ damage (WuWa formula) — calculateDamage(damage, triggerBus), dmgBonus รวมทั้ง attacker+target
│   └── Combat/
│       ├── EnergyService.ts         # increaseEnergy(unit, amount, triggerBus, actionType?) — จุดเดียวที่ mutate energy
│       ├── EndActionService.ts      # notifyEndAction(timeline, duration, actionName?) — schedule NotificationEvent(EndAction), event.execute ปล่อย isGlobalLocked + unit.setFree()
│       └── ChangeToAutoService.ts   # notifyChangeToAuto(timeline, autoStartFrame, actionName?) — schedule NotificationEvent(ChangeToAuto), event.execute ปล่อยแค่ isGlobalLocked (unit ยัง Busy)
│
├── Simulator/
│   ├── BattleField.ts               # การต่อสู้ 1 ครั้ง — roster (allies/enemies/onFieldChar) + คิว event (IPQ/currentFrame/isGlobalLocked) + applyResourceGain รวมอยู่ในคลาสเดียว
│   ├── Simulate.ts                  # ตัวจัดการรอบการรัน — ถือ BattleField, addAlly/spawnEnemy/increaseEnergy/run
│   ├── RotationBuilder.ts           # fluent builder → สร้าง Queue<RotationAction>
│   ├── RotationDirector.ts          # ขับ setup/loop queue → execute action → tick battleField
│   └── TriggerBus.ts                # pub/sub กลาง — ตัวละคร register listener ต่อ TriggerEvent แล้ว engine emit ตอน trigger จริง
│
├── Utils/
│   ├── queue.ts                     # FIFO Queue (object-map backed) — O(1) ทุก op, มี rotate()
│   ├── priorityQueue.ts             # Binary min-heap (PQ<T>) — push/pop O(log n), delete by predicate
│   └── IndexedPriorityQueue.ts      # PQ + positionMap → update/delete/has ด้วยชื่อ O(log n)
│
├── Test/
│   ├── automated/                   # ✅ Jest tests ที่ใช้งานได้ (ครอบคลุมโดย jest.config.js) — 10 suite / 118 tests
│   │   ├── Utils/                   #   Queue / PriorityQueue / IndexedPriorityQueue
│   │   ├── Simulator/               #   TriggerBus.test.ts, BattleField.test.ts, CombatTimeline.test.ts
│   │   ├── Services/                #   DamageCalculate.test.ts, EnergyService.test.ts
│   │   └── Models/                  #   EnemyUnit.test.ts, Damage.test.ts (การกรองตาม SkillRange ย้ายไปอยู่ที่ BattleField.test.ts แล้ว)
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
| `StatsType` | `AtkP`, `FlatAtk`, `Hp`, `FlatHp`, `DefP`, `FlatDef`, `CR`, `CD`, `Dmg`, `Amp`, `Sp`, `DefShred`, `DefRed`, `Res`, `ResRed`, `ResPen`, `DmgRed`, `ElemRed`, `TbBoost`, `HealBonus`, `IncHealBonus` — แต่ละตัว comment กำกับว่า Ally/Enemy/Both ใช้จริง (อ้างอิง `DamageCalculate.ts`); `TbBoost`/`HealBonus`/`IncHealBonus` ยังไม่ต่อสายเข้าสูตรไหน — เพิ่มไว้เฉยๆ; `ALLY_STATS`/`ENEMY_STATS` (array แยก) เป็น dead export ไม่มีใครเรียกใช้ตอนนี้ |
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
CombatEvent (abstract)            — name, time, priority, execute: () => void   (ไม่มี duration แล้ว — ย้ายไปอยู่แค่ ActionEvent/BuffStartEvent เท่านั้น เพราะเป็น 2 คลาสเดียวที่ใช้จริง)
├── ActionEvent (abstract)        — + unit, actionType, isManual, duration?, autoStartFrame?   ← เช็ค "มีการ action"
│   ├── AttackActionEvent         — execute ตั้งเป็น setBusy + onExecute?.() + auto-schedule EndAction (ถ้ามี duration+timeline) + auto-schedule ChangeToAuto (ถ้ามี autoStartFrame+timeline)
│   └── BuffActionEvent           — execute ตั้งเป็น setBusy (auto-schedule เหมือนกันทั้งคู่ เพราะ logic อยู่ใน ActionEvent constructor)
├── BuffEvent (abstract)          — + target (ไม่มี duration)      ← เช็ค "บัพเริ่ม/จบ"
│   ├── BuffStartEvent            — + duration? (เก็บ field ของตัวเอง ไม่ใช่จาก CombatEvent) — ใช้ default no-op execute (ยังไม่มี logic auto-schedule BuffEndEvent)
│   └── BuffEndEvent              — ไม่มี duration — ใช้ default no-op execute (ยังไม่มี logic)
├── DamageEvent                   — + damage, target, (onExecute?, triggerBus?) — ถ้ามี triggerBus execute จะเรียก calculateDamage() จริง
└── NotificationEvent             — + notifyType, unit (ใช้ default no-op execute — signal-only ให้ CombatTimeline.tick() อ่าน notifyType เอง)
```

**`execute` เป็น field ไม่ใช่ abstract method แล้ว** — `CombatEvent.execute: () => void = () => {}` (default no-op) ทุก subclass ตั้งค่าจริงด้วย `this.execute = () => {...}` ใน constructor แทนการ override method เดิม ผลคือ **เปลี่ยนค่าได้ทีหลังต่อ instance** เหมือนตัวแปรทั่วไป เช่น `event.execute = () => {...}` แก้แค่ตัวนั้นตัวเดียว ไม่กระทบ instance อื่นของ class เดียวกันเลย (`CombatTimeline.tick()` เรียก `event.execute()` เหมือนเดิมทุกอย่าง เพราะ syntax เรียก field-ที่เป็น-function กับเรียก method เหมือนกัน)

**`duration` ไม่ได้อยู่ใน `CombatEvent` แล้ว** — ย้ายลงไปเป็น field ของตัวเองใน `ActionEvent` และ `BuffStartEvent` เท่านั้น (2 คลาสเดียวที่มี logic ใช้จริง) `DamageEvent`/`NotificationEvent`/`BuffEvent`/`BuffEndEvent` ไม่มี `duration` อีกต่อไป — `super()` ของแต่ละ event ตอนนี้เรียกแค่ `(name, time, priority)` ไม่มี `duration` ปนแล้ว

### `AttackActionEvent` / `BuffActionEvent` — static factory, ไม่มี `new` ตรงๆ แล้ว

`constructor` เป็น **private** — ห้ามเรียก `new AttackActionEvent(...)`/`new BuffActionEvent(...)` ตรงๆ จากข้างนอก ต้องผ่าน static factory 2 ตัวเท่านั้น (ตั้งชื่อต่างกันแทนการเดา runtime type จาก arg แบบเดิม — เลิกใช้ `parseActionTail`/tail-parsing แล้วทั้งหมด เพราะมีปัญหา `duration:0` ชนกับ `isManual:false` ที่ทำให้ `Mornye`'s `Ult` rotation ค้าง `isGlobalLocked:true` ตลอดไปจริง):

| Factory | Signature | ใช้เมื่อ |
|---|---|---|
| `.manual(name, time, priority, unit, actionType, duration?, autoStartFrame?, onExecute?, timeline?)` | `isManual: true` เสมอ | action ที่ต้องล็อก GlobalLock — **throw ทันทีถ้า `duration` และ `autoStartFrame` เป็น `undefined` ทั้งคู่** (ป้องกัน `isGlobalLocked` ค้าง `true` ตลอดไปโดยไม่มีทางปลด) |
| `.auto(name, time, priority, unit, actionType, onExecute?, timeline?)` | `isManual: false` เสมอ | action ที่ไม่ล็อก GlobalLock — ไม่รับ `duration`/`autoStartFrame` เลยเพราะไม่มีอะไรต้องปลดล็อก |

`duration: 0` เป็นค่าปกติธรรมดาแล้ว ไม่ชนกับอะไรอีกต่อไป (ไม่มี "0 = isManual:false" แบบเดิม) — `Mornye.ts`'s `Ult` (`duration: 0`) ส่งผ่าน `.manual(..., Ult.duration, undefined, ...)` ได้ตรงๆ แล้ว ผลคือ auto-schedule `EndAction` ที่ frame เดียวกันทันที (unlock ทันที) ไม่ค้างอีกต่อไป

ถ้าใส่ `duration` + `timeline` มาด้วย `execute()` จะเรียก `notifyEndAction(timeline, duration)` ([EndActionService.ts](app/Services/Combat/EndActionService.ts)) ให้อัตโนมัติ — `Test1.ts`/`Test2.ts` เก่ายังเรียกแบบไม่ส่ง `timeline` เข้าไป จึงยังต้อง schedule `NotificationEvent(EndAction)` มือเหมือนเดิม (ไม่เกิดการ schedule ซ้ำ) — เรียกผ่าน `.manual(..., duration, undefined, onExecute)` (ต้องใส่ `undefined` แทน `autoStartFrame` ที่ข้ามไปเพราะเป็น named param ธรรมดาแล้ว ไม่ใช่ tail แบบเดิม)

ถ้าใส่ `autoStartFrame` + `timeline` มาด้วย `execute()` จะเรียก `notifyChangeToAuto(timeline, autoStartFrame)` ([ChangeToAutoService.ts](app/Services/Combat/ChangeToAutoService.ts)) ให้อัตโนมัติเช่นกัน (คนละ branch กับ EndAction — ใส่ทั้งคู่พร้อมกันได้) ปล่อยแค่ `isGlobalLocked` ส่วน unit ยังคง `Busy` ต่อ — ยังไม่มีตัวละครไหนส่งค่านี้จริงตอนนี้ (`MoveData.autoStartFrame` ก็เป็น field รอข้อมูลเช่นกัน)

`ActionEvent` เอง (abstract, internal, เรียกผ่าน `super()` จาก 2 factory เท่านั้น) รับ arg แบบ resolve ครบแล้ว: `(name, time, priority, unit, actionType, isManual=true, duration?, autoStartFrame?, onExecute?, timeline?)`

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

## BattleField — การต่อสู้ 1 ครั้ง (`Simulator/BattleField.ts`)

`BattleField` กับ `CombatTimeline` **ถูกรวมเป็นคลาสเดียวแล้ว** (`CombatTimeline.ts` ถูกลบทิ้ง) เพราะทุกจุดที่ใช้ตัวหนึ่งก็ต้องใช้อีกตัวเสมอ — แยกไว้แล้วไม่มีใครได้ประโยชน์ มีแต่ต้องส่งต่อกันไปมา

| กลุ่ม | member |
|---|---|
| ใครอยู่ในสนาม | `allies`, `enemies`, `onFieldChar`, `createEnemy()`, `enemiesInRange()`, `resetAllUnits()` |
| เวลาและคิว event | `currentFrame`, `isGlobalLocked`, `schedule()`, `scheduleStartCombo()`, `scheduleBuffStart()`, `tick()`, `runAll()`, `peek()`, `isEmpty`, `size` |
| อื่นๆ | `triggerBus` (รับทาง constructor แบบมี default), `applyResourceGain()` |

- **1 instance = 1 การต่อสู้ที่แยกขาด** — ไม่ใช่ global singleton แล้ว ไม่มี state รั่วข้ามรอบ simulate หรือข้าม test case
- `enemiesInRange(range)` กรอง `enemies` ที่ `position < range` (`SkillRange.None = "0"` จึงคืน array ว่างเสมอ)
- `resetAllUnits()` วน unit ทุกตัวเรียก `initDefaultStats()` — **ตัวละครที่ `setStat()` ต้อง `setDefaultStat()` คู่กันเสมอ** ไม่งั้นค่าจะกลายเป็น 0 ตั้งแต่รอบแรก
- `applyResourceGain(damage)` จ่าย energy/concento/gauge ให้ผู้ตี — แยกออกมาจาก `calculateDamage` เพราะเป็นคนละเรื่องกับสูตรดาเมจ
- **ไม่มี `TimelineRef` แล้ว** — `AllyUnit.rotations` รับ `BattleField` ตรงๆ (`import type` เลี่ยง circular import)
- `Damage` ไม่รู้จัก `BattleField` — รับเฉพาะ `EnemyUnit | EnemyUnit[]` คนเรียกกรองเองก่อน: `new Damage(unit, "BA1", ActionType.BA, battleField.enemiesInRange(SkillRange.Contact))`
- ⚠️ ยังไม่มีจุดไหนใน `manualBuilder.ts` เรียก `spawnEnemy()` เลย — Test1/Test2 ไม่ได้ใช้ `Damage`/`DamageEvent` (แค่ log)

## Simulate (`Simulator/Simulate.ts`)
ตัวจัดการ **รอบการรัน** — `BattleField` คือสถานะระหว่างสู้ ส่วน `Simulate` คือคนประกอบและสั่งเริ่ม

```ts
const sim   = new Simulate();
const unit  = sim.addAlly(new AllyUnit("Mornye"));   // ตัวแรกกลายเป็น onFieldChar ให้เอง
const enemy = sim.spawnEnemy("Dummy");
const loops = sim.run(setupQueue, loopQueue, maxLoops);   // resetAllUnits ก่อนเสมอ
```

`sim.triggerBus` เป็น getter ที่ชี้ไปที่ `battleField.triggerBus` ตัวเดียวกัน ไม่ใช่ instance ที่สอง

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
| res | piecewise โดย `RES = res − resred − resPen` (`res` = ต้านทานพื้นฐานของ enemy, `resred` = debuff ที่ลด `res`, `resPen` = attacker เจาะ): `RES<0 → 1−RES/2` / `0≤RES<0.8 → 1−RES` / `RES≥0.8 → 1/(1+5×RES)` |
| reduction | `max(0, 1 − DmgRed)` |

---

## ข้อควรระวัง / Known issues
- `DamageEvent` เรียก `calculateDamage()` ได้แล้ว **แต่ต้องส่ง `triggerBus` เข้า constructor เอง** (parameter สุดท้าย) ถ้าไม่ส่งจะ no-op เงียบๆ (ไม่ error แต่ก็ไม่คำนวณอะไรเลย) — ยังไม่บันทึกผลลงใน `attacker.dmgRecord` (แค่ print เฉยๆ ผ่าน `calculateDamage`)
- `BuffStartEvent` / `BuffEndEvent` ยังใช้ default no-op execute จาก `CombatEvent` (ยังไม่มี logic เพิ่ม/ลบ stat จริง)
- `Test/Utils/` เป็น duplicate เก่าที่ import path ผิด — ใช้ `Test/automated/Utils/` แทน
- `Mornye` เป็นตัวละครจริงตัวแรก (base stats + default stats + rotation ครบทุกท่า: "BA Combo", "EBA Combo", "HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME", "HA_INVERSION_DAMAGE_FRAME", "ESkill", "Ult", "Intro") ค่าท่าเก็บเป็น `MoveData` ตัวเดียวต่อท่า (import จาก `Models/Combat/MoveData.ts`) — `BA1`/`BA2`/`BA3` มี `mtpr`/`type` จริงแล้ว ส่วนท่าที่เหลือมี `duration`/`damageFrame` จริงแต่ `mtpr` ยังเป็น placeholder `0` (type เดา `MultiplierType.Atk` ไว้ก่อน) รอข้อมูลจริง (ดีล 0.00 ตอนนี้) — `Test1`/`Test2` ยังเป็น scaffolding เดิม ไม่มี passive ที่ register กับ `TriggerBus` จริง
- `manualBuilder.ts` ยังใช้แค่ `Test1`/`Test2` ไม่ได้เปลี่ยนไปใช้ `Mornye` หรือ `battleField`/`createEnemy` เลย — ถ้าจะรัน Mornye จริงต้องประกอบ `manualBuilder` ใหม่เอง (ดูตัวอย่างการรันใน scratchpad ระหว่างพัฒนา) **สำคัญ**: ถ้าจะรัน Mornye ในซีนที่มีมากกว่า 1 ตัวละคร ต้องคอยสลับ `timeline.onFieldChar` ให้ตรงตัวที่กำลัง action อยู่เองด้วย — `EndActionService.ts`/`ChangeToAutoService.ts` resolve unit จาก `timeline.onFieldChar` ไม่ใช่จาก unit ของ action โดยตรง ถ้าไม่ sync ให้ตรง `unit?.setFree()` จะ no-op เงียบๆ (unit ค้าง Busy ตลอดไปแม้ `isGlobalLocked` จะปลดถูกก็ตาม) — `manualBuilder.ts` เองก็ set `onFieldChar = test1` ครั้งเดียวไม่เคยสลับเป็น `test2` เลย (ไม่พังเพราะ `Test1`/`Test2` schedule `NotificationEvent` มือพร้อม unit ตรงๆ ไม่ผ่าน `onFieldChar`)
- `ALLY_STATS`/`ENEMY_STATS` ใน `Enum.ts` เป็น dead export (เคยตั้งใจใช้ populate `defaultStats` อัตโนมัติตอนสร้าง `AllyUnit`/`EnemyUnit` แต่ถูกยกเลิกไปแล้ว)
- เอกสาร trace แบบ static ใน `Test/manual/*.html` (`manualBuilder-trace.html`, `void-fn-problem.html`) ล้าสมัยแล้วหลัง refactor `execute` เป็น field — ไม่ใช่โค้ดที่รันจริง แค่เอกสารประกอบเก่า
