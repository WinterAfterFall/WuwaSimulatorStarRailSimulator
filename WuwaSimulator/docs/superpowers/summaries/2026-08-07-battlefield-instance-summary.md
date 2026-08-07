# สรุปงาน — BattleField: global singleton → instance

วันที่: 2026-08-07
สถานะ: **เสร็จสมบูรณ์**

- Spec: [2026-08-07-battlefield-instance-design.md](../specs/2026-08-07-battlefield-instance-design.md)
- Plan: [2026-08-07-battlefield-instance.md](../plans/2026-08-07-battlefield-instance.md)

---

## ปัญหาที่แก้

`battleField` เดิมเป็น module-level `const` — ES module ถูก evaluate ครั้งเดียว ทุกไฟล์ที่ import
จึงได้ object เดียวกันเสมอ และ `createEnemy()` มีแต่ `push` ไม่มีใครลบ ผลคือรัน simulation
มากกว่า 1 รอบใน process เดียว มอนของรอบก่อนจะค้างแล้วปนเข้ารอบใหม่:

```ts
runSim(teamA);   // enemies = [Boss_A]
runSim(teamB);   // enemies = [Boss_A, Boss_B]   ← ตี 2 ตัว DPS พุ่งเป็น 2 เท่า
```

จุดที่พังคือ `Damage`'s overload `SkillRange` ที่ไปหยิบเป้าจาก global เอง — ผิดโดย**ไม่มี error ใดๆ**
โปรแกรมทำงานปกติทุกอย่าง แค่ตัวเลขผิด

**ทำไมต้องแก้ตอนนั้น:** ไม่ใช่ปัญหาอนาคตล้วน — Jest รัน test ในไฟล์เดียวกันด้วย process เดียว
`Damage.test.ts` จึงต้อง set/clear `battleField.enemies` เองมือๆ ลืมเมื่อไหร่ test รั่วข้ามกัน
(ผ่านตอนรันเดี่ยว fail ตอนรันพร้อมกัน) และ test คือสิ่งที่ค้ำความถูกต้องซึ่งเป็นเป้าหมายหลักของโปรเจกต์

---

## สิ่งที่เปลี่ยน

### 1. `BattleField` เป็น class

```ts
export class BattleField {
    public allies : AllyUnit[]  = [];
    public enemies: EnemyUnit[] = [];

    public createEnemy(name: string): EnemyUnit;
    public enemiesInRange(range: SkillRange): EnemyUnit[];
    public resetAllUnits(): void;
}
```

`enemiesInRange()` รับ logic กรอง range ที่ย้ายมาจาก `Damage` — คงพฤติกรรมเดิมทุกอย่างรวมถึง
`SkillRange.None = "0"` ที่คืน array ว่างเสมอ

### 2. `CombatTimeline` เป็นเจ้าของ

```ts
public triggerBus : TriggerBus  = new TriggerBus();
public battleField: BattleField = new BattleField();   // ← เพิ่ม
```

`new CombatTimeline()` 1 ครั้ง = 1 สนามรบที่แยกขาด ไม่ต้องจำว่าต้อง clear อะไรก่อนเริ่มรอบใหม่

### 3. `Damage` ตัด dependency ทิ้ง

overload `SkillRange` หายไป เหลือ constructor เดียวที่รับ `EnemyUnit | EnemyUnit[]` — คนเรียกกรองเอง:

```ts
new Damage(mornye, "BA1", ActionType.BA, timeline.battleField.enemiesInRange(SkillRange.Contact))
```

`Damage` จึงไม่ import อะไรจาก `Simulator/` อีกเลย กลายเป็น data object ล้วน — test แค่ส่ง array
เข้าไปตรงๆ ไม่ต้อง setup สนามรบ

### 4. `TimelineRef` เพิ่ม `readonly battleField: BattleField`

ใช้ `import type` เลี่ยง circular import แบบเดียวกับที่ `TriggerBus` ทำอยู่แล้ว

---

## Commit

ทุก commit compile ผ่านและ test เขียว — เพิ่ม class ก่อน ย้าย caller ทีละจุด แล้วค่อยลบ global
เป็นขั้นสุดท้าย

| Commit | ทำอะไร |
|---|---|
| `c1eff7b` | design spec |
| `7942b72` + `1357d74` | implementation plan (+ แก้ git path ในแผน) |
| `b341bc8` | `class BattleField` + test 18 ข้อ (ยังไม่ลบ global) |
| `d0459c4` | `CombatTimeline` ถือ instance + `TimelineRef` |
| `3c3b3de` | `Damage` ตัด overload `SkillRange` |
| `5439d44` | ลบ global singleton ทิ้ง |
| `f435ed7` | อัปเดต `CLAUDE.md` |

---

## ผลการทดสอบ

```
Test Suites: 10 passed, 10 total
Tests:       118 passed, 118 total
```

เดิม 8 suite / 100 tests — เพิ่ม `Simulator/BattleField.test.ts` (18 tests) และ
`Simulator/CombatTimeline.test.ts` (3 tests) ส่วน `Damage.test.ts` ย้าย test ชุด range ออกไป
และลบบรรทัด cleanup มือทิ้ง

**test ที่สำคัญที่สุด** คือชุด `isolation between instances` — สร้าง `BattleField` / `CombatTimeline`
อย่างละ 2 ตัวแล้วยืนยันว่าไม่เห็นข้อมูลกัน ถ้ามีใครเผลอทำให้กลับไปเป็น global อีก test ชุดนี้จะจับได้ทันที

ยืนยันเพิ่มเติม:
- ไม่มีไฟล์ไหนใน `app/` import `battleField` global อีก
- `Damage.ts` ไม่มีคำว่า `Simulator` เหลืออยู่เลย

---

## เรื่องที่พบระหว่างทาง แต่ไม่ได้แก้ (อยู่นอกขอบเขต)

**`npm start` ยังรันไม่ได้** — เกณฑ์ปิดงานข้อนี้ใน plan จึง verify ไม่ได้จริง ด้วย 2 สาเหตุที่มีอยู่ก่อนแล้ว:

1. `tsx` อยู่ใน `devDependencies` แต่ไม่ได้ถูกติดตั้งใน `node_modules` (ต้อง `npm install` ก่อน)
2. `app/Data/Characters/Test1.ts` และ `Test2.ts` เรียก `AttackActionEvent` ด้วย signature เก่า
   (ส่ง callback ตรงตำแหน่งที่ตอนนี้รับ `isManual?: boolean`) → `TS2769` ตกค้างจาก refactor
   commit `2f98d08` — jest จับไม่ได้เพราะไม่มี test ไหน import 2 ไฟล์นี้

ใช้ `tsc --noEmit` ตรวจแทนและยืนยันได้ว่า error ทั้งหมดอยู่ใน `Test1`/`Test2` ไม่มีอันไหนมาจากไฟล์ที่
refactor นี้แตะ — แต่แปลว่า **`manualBuilder.ts` ยังไม่เคยถูกรันจริงหลัง refactor นี้**

**`app/Test/manual/3-advanced-ipq.ts` วงเล็บปีกกาไม่ปิดที่บรรทัด 51** ทำให้ `npx tsc --noEmit`
ทั้งโปรเจกต์พัง — เป็น scratch file เก่าที่ jest ไม่ได้รันอยู่แล้ว

## สิ่งที่ตั้งใจไม่ทำ (YAGNI)

- ไม่เพิ่ม `createAlly()` และไม่แก้ `manualBuilder` ให้ push ally — ยังไม่มีใครอ่าน
  `battleField.allies` เลยสักจุด รอจนมีคนใช้จริง (เช่นตอนทำบัพทีม)
- ไม่แตะ known issue อื่นใน `CLAUDE.md` เช่น `onFieldChar` ที่ต้องสลับเอง หรือ `BuffStartEvent`
  ที่ยังไม่มี logic
