# BattleField: จาก global singleton → instance ต่อ 1 การต่อสู้

วันที่: 2026-08-07

## ปัญหา

`battleField` ใน `app/Simulator/BattleField.ts` เป็น module-level `const` — ES module ถูก evaluate
ครั้งเดียว ทุกไฟล์ที่ import จึงได้ object เดียวกันเสมอ (global singleton)

`createEnemy()` มีแต่ `push` เข้า `battleField.enemies` ไม่มีจุดไหนลบออก และ `resetAllUnits()`
ที่มีอยู่ก็แค่ reset stats กลับค่า default **ไม่ได้เอา unit ออกจาก array**

ผลคือรัน simulation มากกว่า 1 รอบใน process เดียว มอนของรอบก่อนจะค้างแล้วปนเข้ารอบใหม่:

```ts
runSim(teamA);   // createEnemy("Boss") → enemies = [Boss_A]
runSim(teamB);   // createEnemy("Boss") → enemies = [Boss_A, Boss_B]  ← ตี 2 ตัว
```

จุดที่พังคือ `Damage.ts:145` — overload `SkillRange` ไปหยิบเป้าจาก global เอง:

```ts
this.targets = battleField.enemies.filter(e => Number(e.position) < Number(targetOrRange));
```

DPS ของรอบที่ 2 เป็นต้นไปจะพุ่งขึ้นโดย **ไม่มี error ใดๆ** — โปรแกรมทำงานปกติทุกอย่าง แค่ตัวเลขผิด
ซึ่งขัดกับเป้าหมาย "ถูกต้องก่อน สวยงามทีหลัง" ของโปรเจกต์โดยตรง

### ทำไมต้องแก้ตอนนี้

1. **Test — เป็นปัญหาอยู่แล้ววันนี้** Jest รัน test ในไฟล์เดียวกันด้วย process เดียว
   `Damage.test.ts:124,128` จึงต้อง set/clear `battleField.enemies` เองมือๆ ลืมเมื่อไหร่ test
   จะรั่วข้ามกันแล้ว fail แบบสับสน (ผ่านตอนรันเดี่ยว fail ตอนรันพร้อมกัน) — ปัญหานี้จะแย่ลง
   ตามจำนวน test ที่เพิ่มขึ้น และ test คือสิ่งที่ค้ำ "ความถูกต้อง" ซึ่งเป็นเป้าหมายหลักของโปรเจกต์
2. **เว็บ (เฟส 2)** 1 แท็บ = 1 JS context ที่อยู่ยาว user กดคำนวณซ้ำ 10 ครั้ง = 10 รอบใน process
   เดียว ทางเลี่ยงมีอย่างเดียวคือ reload หน้าทุกครั้ง ซึ่งใช้จริงไม่ได้
3. **ต้นทุนต่ำที่สุดคือตอนนี้** มีไฟล์เดียวที่ import `battleField` จริง (`Damage.ts`)

หมายเหตุ: การรันบน Node server **ไม่เกิด race condition** เพราะ `RotationDirector.run()` เป็น
synchronous ล้วน (`while (this.step()) {}` ไม่มี `await`) และ Node เป็น single-thread — request
แทรกกลางคันไม่ได้ ปัญหาคือ state ค้างข้าม request กับ memory leak ไม่ใช่ race

## ทางเลือกที่พิจารณา

| ทางเลือก | สรุป | ผล |
|---|---|---|
| 1. `BattleField` เป็น class + ย้ายการกรอง range ไปไว้ที่ `BattleField` | `Damage` รับเฉพาะ `EnemyUnit[]` ที่กรองมาแล้ว | **เลือกอันนี้** |
| 2. `BattleField` เป็น class + `Damage` รับ `battleField` เข้า constructor | เก็บ overload `SkillRange` ไว้ | ไม่เลือก — `Damage` ยังผูกกับ `BattleField`, test ต้องประกอบ dependency, constructor overload บวมขึ้น |
| 3. `createBattle()` factory คืน context object | รวม timeline + battleField + triggerBus | ไม่เลือก — `CombatTimeline` ทำหน้าที่นี้อยู่แล้ว เพิ่ม layer = over-engineering |

เหตุผลที่เลือกข้อ 1: แก้ปัญหา global **พร้อมกับ** ทำให้ `Damage` test ได้โดยไม่ต้อง setup อะไรเลย
และไม่ได้เพิ่ม abstraction ใหม่แม้แต่ชั้นเดียว — แค่ย้าย logic ที่มีอยู่แล้วไปวางให้ถูกที่
(logic "ใครอยู่ในระยะ" ควรอยู่กับคนที่ถือ roster)

## Design

### BattleField เป็น class

```ts
export class BattleField {
    public allies : AllyUnit[]  = [];
    public enemies: EnemyUnit[] = [];

    /** สร้าง EnemyUnit แล้ว push เข้า enemies ให้เลย */
    public createEnemy(name: string): EnemyUnit;

    /** กรอง enemies ที่ position < range — logic เดิมจาก Damage.ts:145 ย้ายมาที่นี่ */
    public enemiesInRange(range: SkillRange): EnemyUnit[];

    /** reset stats ของทุก unit กลับค่า default (พฤติกรรมเดิมของ resetAllUnits) */
    public resetAllUnits(): void;
}
```

`enemiesInRange()` คงพฤติกรรมเดิมเป๊ะ รวมถึงกรณี `SkillRange.None = "0"` ที่คืน array ว่างเสมอ
(ไม่มี position ไหน `< 0`) — ไม่แก้ semantics ระหว่างทาง

### CombatTimeline เป็นเจ้าของ

```ts
public triggerBus : TriggerBus  = new TriggerBus();
public battleField: BattleField = new BattleField();   // ← เพิ่ม
```

สร้างใน field initializer เหมือน `triggerBus` เพราะเป็นของประเภทเดียวกัน — state กลางที่ทุกคน
ในการต่อสู้นี้ใช้ร่วมกัน ผลคือ `new CombatTimeline()` 1 ครั้ง = 1 สนามรบที่แยกขาดจากกันสมบูรณ์
ไม่ต้องจำว่าต้อง clear อะไรก่อนเริ่มรอบใหม่

### Damage ตัด dependency ทิ้ง

ลบ `import { battleField }` และลบ overload `SkillRange` เหลือ overload เดียว:

```ts
constructor(
    attacker   : AllyUnit,
    name       : string,
    attackType : ActionType | ActionType[],
    target     : EnemyUnit | EnemyUnit[],
    energyGain?: number,
    concentoEnergyGain?: number
)
```

body เหลือ 2 กรณี ตัด branch `typeof targetOrRange === "string"` ทิ้ง:

```ts
this.targets = Array.isArray(target) ? target : [target];
```

ฝั่งคนเรียกกรองเองก่อนส่งเข้ามา:

```ts
new Damage(mornye, "BA1", ActionType.BA, timeline.battleField.enemiesInRange(SkillRange.Contact))
```

`Damage` จึงไม่ import อะไรจาก `Simulator/` อีกเลย กลายเป็น data object ล้วน

### TimelineRef

เพิ่ม `readonly battleField: BattleField` ลงใน structural type ที่ `AllyUnit.ts:11` เพื่อให้
rotation factory เข้าถึงได้

**circular import:** `BattleField.ts` import `AllyUnit` และ `AllyUnit.ts` จะ import `BattleField`
กลับ = วงกลม แก้ด้วย `import type { BattleField }` ซึ่ง TypeScript ลบทิ้งตอน compile จึงไม่มี
cycle จริงตอน runtime — pattern เดียวกับที่ `TriggerBus` ใช้อยู่แล้วที่ `AllyUnit.ts:6`

## ไฟล์ที่กระทบ

| ไฟล์ | เปลี่ยนอะไร |
|---|---|
| `app/Simulator/BattleField.ts` | เขียนใหม่เป็น class — `const battleField` หายไป, ฟังก์ชันกลายเป็น method, เพิ่ม `enemiesInRange()` |
| `app/Simulator/CombatTimeline.ts` | เพิ่ม field `battleField` |
| `app/Models/AllyUnit.ts` | `TimelineRef` เพิ่ม `readonly battleField` |
| `app/Models/Combat/Damage.ts` | ลบ import + ลบ overload `SkillRange` |
| `app/Test/automated/Models/Damage.test.ts` | ย้าย test ชุด range ไปที่ `BattleField`, ลบ cleanup มือ |
| `app/Test/automated/Simulator/BattleField.test.ts` | ไฟล์ใหม่ |

`manualBuilder.ts` ไม่ต้องแก้ — Test1/Test2 ไม่ได้ใช้ `Damage` เลย

## ขอบเขตที่ไม่ทำ (YAGNI)

- **ไม่เพิ่ม `createAlly()` และไม่แก้ `manualBuilder` ให้ push ally** — ยังไม่มีใครอ่าน
  `battleField.allies` เลยสักจุด เก็บ field ไว้เฉยๆ ตามเดิม รอจนมีคนใช้จริง (เช่นตอนทำบัพทีม)
- **ไม่แตะ known issue อื่นใน `CLAUDE.md`** เช่น `onFieldChar` ที่ต้องสลับเอง, `BuffStartEvent`
  ที่ยังไม่มี logic — คนละเรื่องกัน
- **ไม่อัปเดต `CLAUDE.md` ส่วนที่ drift ไปแล้ว** (`scheduleStartCombo`, `ChangeToAuto` class,
  `EndActionService` ที่ไม่ได้ใช้แล้ว) — เก็บไว้เป็นงานแยก จะได้ไม่ปนกับ diff ของงานนี้

## Testing

ทำแบบ TDD — เขียน test ให้ fail ก่อนแล้วค่อยแก้โค้ด

**test ใหม่ (`BattleField.test.ts`)**
- `createEnemy()` push เข้า `enemies` จริงและคืน instance เดียวกัน
- `enemiesInRange()` กรองถูกทุก tier: `Contact` / `Midrange` / `Ranged` / `Global` / `None`
  (`None` คืน array ว่าง)
- **isolation** — สร้าง `BattleField` 2 ตัว ใส่มอนคนละชุด แล้วยืนยันว่าไม่เห็นข้อมูลกันและกัน
  (test ที่พิสูจน์ว่าบั๊กเดิมตายแล้วจริง)
- `resetAllUnits()` reset stats ของทั้ง allies และ enemies

**test ที่แก้ (`Damage.test.ts`)**
- ชุด `SkillRange` ย้ายไปที่ `BattleField.test.ts`
- เหลือ test ว่า `Damage` รับ `EnemyUnit` / `EnemyUnit[]` แล้ว `targets` ถูกต้อง
- ลบบรรทัด set/clear `battleField.enemies` มือทิ้ง

**เกณฑ์ว่าเสร็จ**
- `npm test` ผ่านครบ ไม่มี suite ไหนหายไปหรือ fail
- `npm start` รันจบโดยไม่ error
- ไม่มีไฟล์ไหนใน `app/` เหลือ `import { battleField }` อีก
