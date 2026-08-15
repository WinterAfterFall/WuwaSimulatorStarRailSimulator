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

**สิ่งที่ห้ามแลกทิ้งเพื่อความ simple** — สามข้อนี้คือสิ่งที่ทำให้ "แก้ทีหลังได้" เป็นจริง ไม่ใช่ของฟุ่มเฟือย

1. **test ต้องเขียวเสมอ** และงานใหม่ทุกชิ้นเขียน test ก่อน (ดูรอบการทำงานใน `docs/superpowers/`) — test คือสิ่งเดียวที่ทำให้กล้ารื้อโครงทีหลัง
2. **ห้าม state รั่วข้ามรอบ simulate** — ไม่มี global mutable, ทุกอย่างผูกกับ instance ที่มีอายุชัดเจน (เหตุผลเต็มอยู่ใน `docs/superpowers/summaries/2026-08-07-battlefield-instance-summary.md`)
3. **ทุก pattern ที่ถูกยุบเข้า helper ต้องเหลือ "ฉบับกางเต็ม" ไว้ 1 ชุดเสมอ** เป็นโค้ดจริงที่ tsc ตรวจ ไม่ใช่ comment (comment เน่าเงียบๆ ตอน signature เปลี่ยน) — ตัวอย่างปัจจุบันคือ `"BA Combo"` ใน [Mornye.ts](app/Data/Characters/Support/Mornye.ts) ที่จงใจไม่ใช้ helper `rotation()` เหมือน rotation ตัวอื่น
   **ห้าม refactor ยุบทิ้งเด็ดขาด** — ความซ้ำนั้นตั้งใจไว้ให้คนอ่านเข้าใจว่า 1 RotationAction กางออกเป็น event จริงยังไง ไม่ใช่ของที่หลงเหลือจากการ refactor ค้าง

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
│   ├── AllyUnit.ts                  # ตัวละครฝ่ายผู้เล่น extends Unit — combat state, rotations, swap skills, echo substats, buff/dmg tracking
│   ├── EnemyUnit.ts                 # ศัตรู extends Unit — level, baseElemRed, position, debuff tracking, dmgRecord
│   └── Combat/
│       ├── Damage.ts                # Data object ล้วน — รับ target เป็น EnemyUnit|EnemyUnit[] เท่านั้น ไม่ import อะไรจาก Simulator/
│       ├── MoveData.ts              # interface รวมค่าท่า 1 ท่า — duration/damageFrame/mtpr/type + optional energyGain/concento/autoStartFrame
│       ├── RotationAction.ts        # action ที่ถูก queue ไว้ก่อน schedule (name + execute callback, ยังไม่มี time)
│       └── CombatEvent/
│           ├── resolveTimePriority.ts # helper กลาง — แยก (time?, priority?) หน้า rest params ออกจาก args ของทุก subclass ที่รองรับ 3 overload (name / name+time / name+time+priority)
│           ├── CombatEvent.ts       # base ของทุก event — execute เป็น field `(battleField: BattleField) => void` (default no-op) ไม่ใช่ abstract method แล้ว เปลี่ยนค่าได้ทีหลัง (`event.execute = ...` หรือ `event.setExecute(...)` ทับทั้งก้อน)
│           ├── ActionEvent.ts       # abstract base ของ action ที่ตัวละครทำ (unit/actionType/isManual) — constructor เดียว public รองรับ 3 overload ผ่าน resolveTimePriority ไม่มี static factory .manual()/.auto() แล้ว — duration/autoStartFrame ไม่ใช่ field ของ event อีกต่อไป ย้ายไปเป็น parameter ของ `battleField.scheduleStartOnFieldAction()` ตอน schedule แทน
│           ├── AttackActionEvent.ts # action โจมตี — inherit constructor ของ ActionEvent ตรงๆ แค่ห่อ execute เพิ่มด้วย `setExecute()` เพื่อ emit `TriggerEvent.AttackAction` ทุกครั้งที่ execute
│           ├── BuffActionEvent.ts   # action buff skill — pattern เดียวกับ AttackActionEvent ทุกอย่าง แค่ emit `TriggerEvent.BuffAction` แทน
│           ├── CastUltimateEvent.ts # event ตอนเริ่มร่าย Ultimate — เช็ค energy พอ ultCost ไหม (throw ถ้าไม่พอ) → หัก energy → emit `TriggerEvent.UltimateCast` → เรียก `unit.ultimate?.(battleField)` — เป็น direct child ของ CombatEvent ไม่ใช่ ActionEvent — ยังไม่มี rotation ไหนสร้าง event นี้จริงตอนนี้
│           ├── BuffEvent.ts         # abstract base ของ event บัพ/ดีบัพ (มี target)
│           ├── BuffStartEvent.ts    # บัพเริ่มมีผล — มี duration? field ของตัวเอง (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── BuffEndEvent.ts      # บัพหมดผล — ไม่มี duration (ใช้ default no-op execute จาก CombatEvent — ยังไม่มี logic)
│           ├── DamageEvent.ts       # ความเสียหาย ณ frame — ไม่ต้องแนบ triggerBus ตอนสร้างแล้ว — execute รับ `battleField` เข้ามาเอง เรียก `calculateDamage(damage)` แล้ว `battleField.applyResourceGain(damage)` ต่อ (ใช้ `this.triggerBus` ของ battleField เอง)
│           └── NotificationEvent.ts # signal event (ChangeToAuto / EndAction / Buff/DebuffExpired)
│
├── Services/
│   ├── Damage/
│   │   └── DamageCalculate.ts       # สูตรคำนวณ damage (WuWa formula) — calculateDamage(damage) เท่านั้น (ไม่รับ triggerBus แล้ว), dmgBonus รวมทั้ง attacker+target
│   └── Combat/
│       └── EnergyService.ts         # increaseEnergy(unit, amount, triggerBus, actionType?) — จุดเดียวที่ mutate energy — EndActionService.ts/ChangeToAutoService.ts ถูกลบไปแล้ว logic ย้ายเข้า BattleField.scheduleStartOnFieldAction()/scheduleStartOffFieldAction() ตรงๆ
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
│   │   ├── Simulator/               #   TriggerBus.test.ts, BattleField.test.ts, Simulate.test.ts
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
│   ├── SubstatData.ts                #   ตาราง exactChance 4 กลุ่ม (main/crit/flatAtk/flatDef) — hard-code จาก wuwa_substat_table.xlsx ข้างล่าง
│   ├── SubstatValueData.ts           #   SUBSTAT_VALUES — ค่า stat จริงต่อ tier (คู่กับ SubstatData.ts ที่เก็บแค่ "โอกาส" ไม่เก็บ "ปริมาณ") keyed ด้วย StatsType ตรงๆ, %-based เก็บเป็น percentage point ให้ตรงหน่วยกับ AllyUnit
│   ├── SubstatProbability.ts         #   getExactChance/getSurvivalChance/getTuneUpChance/buildTuneDecisionMatrix/getSurvivalRatioVsPrevTier/buildSurvivalRatioArray
│   ├── EchoSubstats.ts               #   interface EchoSubstats { type: StatsType; tier: number[]; actionType?: ActionType } — actionType ใช้เฉพาะตอน type===Dmg เพื่อแยก Basic/Heavy/Skill/Ult DMG Bonus ที่รวมกันเป็น StatsType.Dmg ตัวเดียว — ไม่มี class Echo ห่ออีกชั้นแล้ว
│   └── wuwa_substat_table.xlsx       #   ไฟล์ต้นฉบับที่สร้างขึ้นใหม่แทนไฟล์เดิมที่ถูกลบไป — source ของทั้ง SubstatData.ts และ SubstatValueData.ts
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
| `TriggerEvent` | `EnergyIncrease`, `UltimateCast`, `AttackAction`, `BuffAction` (เพิ่ม event ใหม่ที่นี่ + payload คู่กันใน `TriggerEventMap`) — 3 ตัวหลัง emit อัตโนมัติจาก engine เอง (`CastUltimateEvent`/`AttackActionEvent`/`BuffActionEvent`) ต่างจาก `EnergyIncrease` ที่ต้องเรียกผ่าน `EnergyService.increaseEnergy()` เอง |
| `StatsType` | `AtkP`, `FlatAtk`, `Hp`, `FlatHp`, `DefP`, `FlatDef`, `CR`, `CD`, `Dmg`, `Amp`, `Sp`, `DefShred`, `DefRed`, `Res`, `ResRed`, `ResPen`, `DmgRed`, `ElemRed`, `TbBoost`, `HealBonus`, `IncHealBonus`, `EnergyRegen` — แต่ละตัว comment กำกับว่า Ally/Enemy/Both ใช้จริง (อ้างอิง `DamageCalculate.ts`); `TbBoost`/`HealBonus`/`IncHealBonus`/`EnergyRegen` ยังไม่ต่อสายเข้าสูตรไหน — เพิ่มไว้เฉยๆ (`EnergyRegen` ใช้เก็บ Echo substat ผ่าน `EchoSubstats.type` เท่านั้นตอนนี้); `ALLY_STATS`/`ENEMY_STATS` (array แยก) เป็น dead export ไม่มีใครเรียกใช้ตอนนี้ |
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
- **rotations**: `Map<string, (battleField) => Queue<RotationAction>>` — แต่ละ rotation เป็น factory ที่รับ `BattleField` แล้วคืน queue
- **swap skills**: `outroSkill?`/`introSkill?`/`ultimate?` (ทั้งหมด `(battleField) => void`) — ตัวละครที่ไม่มีท่านั้นปล่อย `undefined` ไว้ — `outroSkill`/`introSkill` ถูกเรียกจาก `SwapCharacterEvent` เอง (ดูหัวข้อ Concento ด้านล่าง), `ultimate` ถูกเรียกจาก `CastUltimateEvent`
- **energy**: `energy`, `maxEnergy`, `ultCost` (พลังงานที่ต้องใช้กด Ultimate — เช็คตอน `CastUltimateEvent` execute)
- **concento**: `concentoEnergy`, `maxConcentoEnergy` (default **100**)
- **hp / shield**: `currentHP`, `currentShield`
- **tracking**: `stacks`, `buffNote`, `buffCheck`, `dmgRecord`, `maxDmgRecord` (ทั้งหมด `Map`)
- **echo substats**: `substats?`/`bestSubstats?` (ทั้งคู่ `EchoSubstats`, optional — ดู `extra/substats/EchoSubstats.ts`) — `substats` = ที่ปั้มติดตัวจริงตอนนี้, `bestSubstats` = เป้าหมายที่ต้องการ ยังไม่มี logic ไหนอ่าน/apply สองตัวนี้จริง แค่ประกาศ field ไว้ก่อน
- **ไม่มี `TimelineRef`/`allies`/`enemies` บน unit แล้ว** — rotation ที่ต้องอ่าน roster ให้ `import { battleField } from "../../Simulator/BattleField"` แล้วอ่าน `battleField.allies`/`battleField.enemies` ตรงๆ แทน

### EnemyUnit (extends Unit)
- **level** (default 90) — ใช้คำนวณ DEF: `8×level + 792`
- **baseElemRed** (default 0) — resistance ตั้งต้นของมอน, บวกเพิ่มจาก stat system ได้
- **position**: `EnemyPosition`
- **tracking**: `debuffStacks`, `debuffNote`, `debuffCheck`, `dmgRecord`, `maxDmgRecord`

---

## Event Class Hierarchy
ใช้ `instanceof` แยกประเภท event ตอน tick

```
CombatEvent (abstract)            — name, time, priority, execute: (battleField: BattleField) => void   (ไม่มี duration แล้ว — ย้ายไปอยู่แค่ ActionEvent/BuffStartEvent เท่านั้น เพราะเป็น 2 คลาสเดียวที่ใช้จริง)
├── ActionEvent (abstract)        — + unit, actionType, isManual   ← เช็ค "มีการ action"
│   ├── AttackActionEvent         — execute (ของ ActionEvent) + wrap เพิ่มด้วย setExecute() เพื่อ emit TriggerEvent.AttackAction
│   └── BuffActionEvent           — เหมือน AttackActionEvent ทุกอย่าง แค่ emit TriggerEvent.BuffAction แทน
├── CastUltimateEvent             — + unit — เช็ค energy พอ ultCost ไหม → หัก energy → emit TriggerEvent.UltimateCast → เรียก unit.ultimate?.()
├── BuffEvent (abstract)          — + target (ไม่มี duration)      ← เช็ค "บัพเริ่ม/จบ"
│   ├── BuffStartEvent            — + duration? (เก็บ field ของตัวเอง ไม่ใช่จาก CombatEvent) — ใช้ default no-op execute (ยังไม่มี logic auto-schedule BuffEndEvent)
│   └── BuffEndEvent              — ไม่มี duration — ใช้ default no-op execute (ยังไม่มี logic)
├── DamageEvent                   — + damage, target, onExecute? — execute เรียก calculateDamage(damage) แล้ว battleField.applyResourceGain(damage) ต่อเอง ไม่ต้องแนบ triggerBus ตอนสร้างแล้ว
└── NotificationEvent             — + notifyType, unit (ใช้ default no-op execute — signal-only ให้ BattleField.tick() อ่าน notifyType เอง)
```

**`execute` เป็น field ไม่ใช่ abstract method แล้ว** — `CombatEvent.execute: (battleField: BattleField) => void = () => {}` (default no-op) ทุก subclass ตั้งค่าจริงด้วย `this.execute = (battleField) => {...}` ใน constructor แทนการ override method เดิม ผลคือ **เปลี่ยนค่าได้ทีหลังต่อ instance** เหมือนตัวแปรทั่วไป — `event.execute = (battleField) => {...}` แก้ทับทั้งก้อน หรือใช้ `event.setExecute(fn)` (เพิ่งเพิ่ม, เหมือนกันแค่เป็น method) แก้แค่ instance นั้นตัวเดียว ไม่กระทบ instance อื่นของ class เดียวกันเลย — ถ้าจะ **ต่อท้าย** ของเดิมแทนที่จะทับ ใช้ `battleField.appendOnExecute(event, fn)` แทน (ดูตัวอย่างใน `Test1.ts`/`Test2.ts`)

**`duration` ไม่ได้อยู่ใน `CombatEvent` แล้ว** — ย้ายลงไปเป็น field ของตัวเองใน `BuffStartEvent` เท่านั้น (คลาสเดียวที่ยังมี logic ใช้จริง) ส่วน `ActionEvent`/`AttackActionEvent`/`BuffActionEvent` **ไม่มี `duration`/`autoStartFrame` เป็น field เลย** — มันไม่ใช่ "ข้อมูลของ action" จริงๆ แค่ค่าที่ใช้ครั้งเดียวตอน schedule จึงย้ายไปเป็น parameter ของ `battleField.scheduleStartOnFieldAction(event, duration?, changeToAutoTime?)` แทน — `super()` ของแต่ละ event ตอนนี้เรียกแค่ `(name, time, priority)` ไม่มี `duration` ปนแล้ว

### `ActionEvent`/`AttackActionEvent`/`BuffActionEvent` — constructor เดียว, ไม่มี static factory `.manual()`/`.auto()` แล้ว

ทุกตัวมี **constructor เดียว public** รองรับ 3 รูปแบบเรียกเหมือน `CombatEvent` (`name` / `name+time` / `name+time+priority` ก่อน `unit, actionType, isManual?`) ผ่าน `resolveTimePriority.ts` (helper กลาง แยก `time`/`priority` ออกจาก args ด้วย `typeof` เช็คว่าเป็น `number` ไหม — required param ตัวแรกของทุก subclass อย่าง `unit`/`target`/`notifyType`/`damage` ไม่ใช่ `number` เลย จึงแยกได้ชัดเจนโดยไม่ชนกัน ต่างจาก tail-parsing แบบเดิมที่เดา arg จากตำแหน่งท้าย):

```ts
new AttackActionEvent(name, unit, actionType, isManual?)
new AttackActionEvent(name, time, unit, actionType, isManual?)
new AttackActionEvent(name, time, priority, unit, actionType, isManual?)
```

`isManual` (optional, default `true`) คือความต่างเดียวระหว่าง manual (`GlobalLock` ON) กับ auto (`UnitLock` เท่านั้น) — `AttackActionEvent`/`BuffActionEvent` ไม่มี field เพิ่มของตัวเองเลย inherit constructor ของ `ActionEvent` ตรงๆ แค่ห่อ `execute` เพิ่มอีกชั้นด้วย `setExecute()` เพื่อ emit `TriggerEvent.AttackAction`/`BuffAction` ตามลำดับทุกครั้งที่ execute จริง

การ schedule (duration + auto-schedule `EndAction`/`ChangeToAuto`) ทำผ่าน `battleField.scheduleStartOnFieldAction(event, duration?, changeToAutoTime?)` ไม่ใช่ผ่าน constructor อีกต่อไป — ผลข้างเคียงเฉพาะท่า (log, บวก stack, ติดบัพ) ให้ต่อผ่าน `battleField.appendOnExecute(event, fn)` แทน ดูตัวอย่างจริงใน `Test1.ts`/`Test2.ts`:

```ts
const event = new AttackActionEvent(`Test1-BA1-f${t}`, unit, ActionType.BA);
battleField.appendOnExecute(event, () => console.log(`[f${t}] Test1-BA1`));
battleField.scheduleStartOnFieldAction(event, BA_DURATION);
```

---

## Combat Simulation Pipeline

```
1. setupTestX(unit)            กำหนด base stats + ลง rotations (factory) ลง unit.rotations
2. RotationBuilder              .add(name, execute).add(...).build() → Queue<RotationAction>
3. RotationDirector(battleField, setupQueue, loopQueue, maxLoops)
       .run()
        ├── step(): ถ้า !isGlobalLocked → nextAction() → action.execute()
        │           (execute จะ schedule AttackActionEvent/CastUltimateEvent/... ลง battleField)
        │           แล้ว tick() วนจน global lock ปลด หรือ battleField ว่าง
        ├── nextAction(): drain setupQueue ก่อน → จากนั้น rotate() loopQueue จนครบ maxLoops
        └── battleField.runAll() drain event ที่เหลือ

BattleField.tick()
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

## กติกาการออกแบบ rotation — ห้าม action ที่มีแต่การสลับตัวเฉยๆ

**ห้าม**เขียน rotation action ที่ทำแค่ `battleField.schedule(new SwapCharacterEvent())` โดยไม่มีตัวละครทำท่าอะไรก่อนเลย — ในเกมจริงไม่มี "เปิด rotation ด้วยการสลับตัวเปล่าๆ" ตัวละครต้องทำท่าอะไรสักอย่าง (อย่างน้อยก็ auto attack) ก่อนจะสลับออกเสมอ

เหตุผลเชิงเทคนิคที่รองรับกติกานี้: `SwapCharacterEvent` ทุกตัว (ทั้งที่ rotation สั่งเองและที่ `endRotation()` ออกให้อัตโนมัติตอนจบรอบ) ใช้ชื่อ `"SwapCharacter"` **ซ้ำกันหมด** — `BattleField.schedule()` เจอชื่อซ้ำในคิวจะ `update()` ทับตัวเดิมแทน `push()` ใหม่ ([BattleField.ts:117-127](app/Simulator/BattleField.ts:117)) ถ้า action แรกของรอบใหม่ยิง `schedule(new SwapCharacterEvent())` ทันทีโดยไม่มี action จริงคั่นก่อน มันจะ schedule ในสเต็ปเดียวกับที่ `endRotation()` เพิ่ง schedule swap ปิดรอบก่อนหน้าไปหมาดๆ (ยังไม่ทันโดน `tick()` ดึงออกไปประมวลผลเลย) → ตัวที่มาทีหลังทับตัวเดิมทิ้ง → swap ปิดรอบก่อนหน้าหายไปเงียบๆ ทำให้ `rotationCount` นับพลาด

action ที่ใช้ `scheduleStartOnFieldAction()` (ท่าจริงที่มี duration + ล็อก) ไม่มีปัญหานี้ เพราะบังคับให้ `step()` วน `tick()` หลายรอบ (ผ่าน `do...while(isGlobalLocked && !isEmpty)`) ก่อนจะกลับไปหา action ถัดไป — swap ที่ schedule ไว้ก่อนหน้าจึงถูก`tick()` ดึงไปประมวลผลจนหมดคิวก่อนเสมอ ไม่มีทางชนกันเอง

---

## Concento เต็ม — เงื่อนไขสลับตัว + Outro/Intro (`SwapCharacterEvent.ts`)

`SwapCharacterEvent.execute` เช็ค `concentoEnergy` ของตัวที่กำลังจะออก (`current`) ก่อนแตะ state อะไรเลย:

- **สลับแบบปกติ** (`isTempSwap !== 1`) **ต้องรอ `current.concentoEnergy >= current.maxConcentoEnergy` ก่อนเสมอ** — ถ้ายังไม่เต็ม `throw` ทันที (กันรอบ simulate เดินต่อทั้งที่ยังไม่ครบเงื่อนไข แล้วไปโผล่เป็นอาการแปลกๆ อีกหลายร้อย frame ถัดไป)
- **ขาแวะ** (`isTempSwap === 1`) ไม่ต้องเช็คเงื่อนไขนี้

หลังผ่านเช็คแล้ว ก่อนตั้ง `onFieldChar = next`:
1. ถ้า `current` มี concento เต็มจริง (`concentoFull`) → เรียก `current.outroSkill?.(battleField)` ก่อนออกจากสนาม
2. ตั้ง `battleField.onFieldChar = next`
3. ถ้า `concentoFull` เดียวกันนั้นเป็น `true` → เรียก `next.introSkill?.(battleField)` ต่อทันที

เพราะสลับปกติผ่านเช็คด้านบนมาแล้วเสมอ (`concentoFull` จึงเป็น `true` เสมอในเคสนั้น) เงื่อนไข `concentoFull` นี้จึงมีผลจริงแค่กับ **ขาแวะ** เท่านั้น — ขาแวะที่ concento ยังไม่เต็มจะสลับตัวได้ปกติแต่ **ไม่** trigger outro/intro

---

## หน่วยเวลา
- ใช้ **frame** (integer) — `1 วินาที = 60 frame` (ค่าคงที่ `F = 60` ใน `manualBuilder.ts`)
- `BattleField.currentFrame` เก็บ frame ปัจจุบัน
- IPQ เรียง event: `time` น้อยออกก่อน → ถ้าเท่ากันใช้ `priority` น้อยออกก่อน

---

## TriggerBus — Passive/Event Hook System (`Simulator/TriggerBus.ts`)

รูปแบบ pub/sub กลาง ปรับมาจากแนวคิด trigger-list ของ StarRailSimulator (`When_Energy_Increase_List` +
`allEventWhenEnergyIncrease`): ตัวละครแต่ละตัว **register callback ของตัวเอง** ลง list กลางตอน setup
แล้วทุกครั้งที่ action จริงเกิด event นั้นขึ้น engine จะวน emit ให้ listener ทุกตัวที่ลงทะเบียนไว้ทำงาน
— แทนที่จะ hardcode logic เฉพาะตัวไว้ตรงจุดเกิด event

```
BattleField.triggerBus : TriggerBus                        ← instance เดียวต่อ 1 battle
    .on(event, callback, priority?)                       ← ลงทะเบียน listener (มากไปน้อยออกก่อน, เท่ากัน = ตามลำดับ register)
    .emit(event, ctx)                                      ← engine เรียกตอน action จริง trigger event นั้น
```

- `TriggerEventMap` (ใน `TriggerBus.ts`) map แต่ละ `TriggerEvent` ไปยัง payload/context ของมัน — เพิ่ม event ใหม่ต้อง
  เพิ่มทั้ง `TriggerEvent` enum (`Constants/Enum.ts`) และ entry ใน `TriggerEventMap` คู่กัน
- `AllyUnit.rotations` factory รับ `BattleField` ตรงๆ ซึ่งมี `triggerBus` ติดมาด้วยอยู่แล้ว (ไม่มี `TimelineRef` แยกแล้ว) —
  ตัวละคร register passive ได้จากใน rotation setup
- **energy gain ทั้งหมดต้องผ่าน `EnergyService.increaseEnergy(unit, amount, triggerBus, actionType?)`** — ฟังก์ชันนี้
  `emit(TriggerEvent.EnergyIncrease, { unit, amount, actionType })` **ก่อน** clamp กับ `maxEnergy` (listener เห็นค่า
  ดิบที่ "จะ" เพิ่ม ก่อนโดนตัด จึงตรวจ overflow ได้ เช่น passive ที่แปลง energy ส่วนเกินเป็นบัพอื่น)
- `DamageCalculate.calculateDamage(damage)` **ไม่รับ `triggerBus` แล้ว** — คำนวณ+print ดาเมจล้วนๆ ไม่แตะ state — energy/concento/gauge
  (รวมถึง `increaseEnergy`) ถูกจ่ายแยกผ่าน `BattleField.applyResourceGain(damage)` ที่ `DamageEvent.execute` เรียกต่อเอง โดยใช้
  `this.triggerBus` ของ `battleField` เอง ไม่ต้องส่ง `triggerBus` ผ่านมาจากผู้เรียกอีกต่อไป
- **3 trigger event ใหม่ emit อัตโนมัติจาก engine เอง ไม่ต้องเรียกเอง**: `TriggerEvent.UltimateCast` (จาก `CastUltimateEvent.execute`),
  `TriggerEvent.AttackAction`/`BuffAction` (จาก `AttackActionEvent`/`BuffActionEvent.execute` ทุกครั้งที่ execute) — ต่างจาก
  `EnergyIncrease` ที่ต้องมีคนเรียก `increaseEnergy()` เองถึงจะ emit

---

## BattleField — การต่อสู้ 1 ครั้ง (`Simulator/BattleField.ts`)

`BattleField` กับ `CombatTimeline` **ถูกรวมเป็นคลาสเดียวแล้ว** (`CombatTimeline.ts` ถูกลบทิ้ง) เพราะทุกจุดที่ใช้ตัวหนึ่งก็ต้องใช้อีกตัวเสมอ — แยกไว้แล้วไม่มีใครได้ประโยชน์ มีแต่ต้องส่งต่อกันไปมา

| กลุ่ม | member |
|---|---|
| ใครอยู่ในสนาม | `allies`, `enemies`, `onFieldChar`, `createEnemy()`, `enemiesInRange()`, `resetAllUnits()` |
| เวลาและคิว event | `currentFrame`, `isGlobalLocked`, `schedule()`, `scheduleStartOnFieldAction()`, `scheduleStartOffFieldAction()`, `appendOnExecute()`, `scheduleBuffStart()`, `endRotation()`, `tick()`, `runAll()`, `peek()`, `isEmpty`, `size` |
| อื่นๆ | `triggerBus` (รับทาง constructor แบบมี default), `applyResourceGain()` |

- **1 instance = 1 การต่อสู้ที่แยกขาด** — ไม่ใช่ global singleton แล้ว ไม่มี state รั่วข้ามรอบ simulate หรือข้าม test case
- `enemiesInRange(range)` กรอง `enemies` ที่ `position < range` (`SkillRange.None = "0"` จึงคืน array ว่างเสมอ)
- `resetAllUnits()` เรียกก่อนเริ่ม simulate รอบใหม่เสมอ — วน unit ทุกตัวเรียก `initDefaultStats()` (**ตัวละครที่ `setStat()`
  ต้อง `setDefaultStat()` คู่กันเสมอ** ไม่งั้นค่าจะกลายเป็น 0 ตั้งแต่รอบแรก) แล้วล้างสถานะรันไทม์ทั้งหมดที่ combat จริง mutate
  ระหว่างสู้ไม่ให้ค้างข้ามรอบ: ฝั่ง ally — `rotationCount`, `energy`, `concentoEnergy`, `currentHP`, `currentShield`,
  `stacks`/`buffNote`/`gauges`/`buffCheck` (clear ทั้งหมด); ฝั่ง enemy — `debuffStacks`/`debuffNote`/`debuffCheck` (clear) —
  **ไม่รวม `dmgRecord`/`maxDmgRecord`** ตั้งใจเก็บไว้ให้ดูผลสรุปย้อนหลังได้หลังจบรอบ — ปิดท้ายด้วยตั้ง `onFieldChar = allies[0]`
  เสมอ (รอบก่อนหน้าอาจทิ้งไว้ที่ตัวไหนก็ได้)
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
- `DamageEvent` เรียก `calculateDamage(damage)` ตรงๆ ไม่ต้องแนบ `triggerBus` แล้ว (energy/concento/gauge จ่ายแยกผ่าน `battleField.applyResourceGain()` ที่ใช้ `triggerBus` ของ `battleField` เอง) — ยังไม่บันทึกผลลงใน `attacker.dmgRecord` (แค่ print เฉยๆ ผ่าน `calculateDamage`)
- `BuffStartEvent` / `BuffEndEvent` ยังใช้ default no-op execute จาก `CombatEvent` (ยังไม่มี logic เพิ่ม/ลบ stat จริง)
- `Test/Utils/` เป็น duplicate เก่าที่ import path ผิด — ใช้ `Test/automated/Utils/` แทน
- `Mornye` เป็นตัวละครจริงตัวแรก (base stats + default stats + rotation ครบทุกท่า: "BA Combo", "EBA Combo", "HA_GEOPOTENTIAL_SHIFT_DAMAGE_FRAME", "HA_INVERSION_DAMAGE_FRAME", "ESkill", "Ult", "Intro") ค่าท่าเก็บเป็น `MoveData` ตัวเดียวต่อท่า (import จาก `Models/Combat/MoveData.ts`) — `BA1`/`BA2`/`BA3` มี `mtpr`/`type` จริงแล้ว ส่วนท่าที่เหลือมี `duration`/`damageFrame` จริงแต่ `mtpr` ยังเป็น placeholder `0` (type เดา `MultiplierType.Atk` ไว้ก่อน) รอข้อมูลจริง (ดีล 0.00 ตอนนี้) — `Test1`/`Test2` ยังเป็น scaffolding เดิม ไม่มี passive ที่ register กับ `TriggerBus` จริง
- `manualBuilder.ts` ยังใช้แค่ `Test1`/`Test2` ไม่ได้เปลี่ยนไปใช้ `Mornye` หรือ `battleField`/`createEnemy` เลย — ถ้าจะรัน Mornye จริงต้องประกอบ `manualBuilder` ใหม่เอง (ดูตัวอย่างการรันใน scratchpad ระหว่างพัฒนา) — หมายเหตุ: `EndActionService.ts`/`ChangeToAutoService.ts` ที่เคยเขียนถึงในเอกสารรุ่นก่อนถูกลบไปแล้ว ตอนนี้ปลดล็อกผ่าน `ActionFreeEvent`/`GlobalFreeEvent` ที่ resolve unit จาก **`event.unit` ของตัวเอง** โดยตรง ไม่ได้พึ่ง `battleField.onFieldChar` แล้ว จึงไม่มีปัญหา sync ตามที่เคยเตือนไว้อีก
- `ALLY_STATS`/`ENEMY_STATS` ใน `Enum.ts` เป็น dead export (เคยตั้งใจใช้ populate `defaultStats` อัตโนมัติตอนสร้าง `AllyUnit`/`EnemyUnit` แต่ถูกยกเลิกไปแล้ว)
- เอกสาร trace แบบ static ใน `Test/manual/*.html` (`manualBuilder-trace.html`, `void-fn-problem.html`) ล้าสมัยแล้วหลัง refactor `execute` เป็น field — ไม่ใช่โค้ดที่รันจริง แค่เอกสารประกอบเก่า
