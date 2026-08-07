# BattleField Instance Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน `battleField` จาก global singleton เป็น instance ที่ `CombatTimeline` เป็นเจ้าของ เพื่อให้ simulation แต่ละรอบมีสนามรบของตัวเองและไม่มี state รั่วข้ามรอบ

**Architecture:** `BattleField` กลายเป็น class ที่ถือ `allies`/`enemies` พร้อม method `createEnemy()` / `enemiesInRange()` / `resetAllUnits()` — `CombatTimeline` สร้างไว้ใน field initializer เหมือน `triggerBus` ส่วน `Damage` ตัด overload `SkillRange` ทิ้งแล้วรับเฉพาะ `EnemyUnit | EnemyUnit[]` ที่กรองมาแล้ว จึงไม่ import อะไรจาก `Simulator/` อีกเลย

**Tech Stack:** TypeScript (strict, noEmit), Jest 29 + ts-jest, tsx

**Spec:** [docs/superpowers/specs/2026-08-07-battlefield-instance-design.md](../specs/2026-08-07-battlefield-instance-design.md)

## Global Constraints

- รันคำสั่งทั้งหมดจากโฟลเดอร์ `WuwaSimulator/` (ที่มี `package.json`) — git repo root อยู่ระดับนอกที่ `C:/Project/WuwaProject`
- `tsconfig` เป็น `strict: true` และ `noEmit: true` — ห้ามใช้ `any` เพิ่ม, ห้ามสร้างไฟล์ `.js`
- Jest เก็บเฉพาะ `app/Test/automated/**/*.test.ts` — test ใหม่ต้องอยู่ใต้โฟลเดอร์นี้เท่านั้น
- ใช้ 4 spaces indent และ comment ภาษาไทยแบบเดียวกับไฟล์รอบข้าง
- **ทุก task ต้องจบด้วย `npm test` ที่ผ่านทั้งหมด** — แผนนี้ออกแบบให้ codebase compile ผ่านและ test เขียวได้ทุก commit (ของเก่าถูกลบทีเดียวใน Task 4 หลังไม่มีใครใช้แล้ว)
- อยู่บน branch `refactor/battlefield-instance` (สร้างไว้แล้ว) — commit ทุก task ตามที่ระบุ

---

### Task 1: `BattleField` class + test

เพิ่ม class ใหม่ **ข้างๆ ของเดิม** โดยยังไม่ลบ `const battleField` / `createEnemy()` / `resetAllUnits()`
เพื่อให้ `Damage.ts` และ `Damage.test.ts` ที่ยังใช้ของเดิมอยู่ compile ผ่านและ test เขียวตลอด

**Files:**
- Modify: `app/Simulator/BattleField.ts` (เพิ่ม class ไว้ด้านบน คงของเดิมไว้ด้านล่าง)
- Test: `app/Test/automated/Simulator/BattleField.test.ts` (สร้างใหม่)

**Interfaces:**
- Consumes: `AllyUnit` (`app/Models/AllyUnit.ts`), `EnemyUnit` (`app/Models/EnemyUnit.ts`), `SkillRange` (`app/Constants/Enum.ts`)
- Produces: `class BattleField` — `allies: AllyUnit[]`, `enemies: EnemyUnit[]`, `createEnemy(name: string): EnemyUnit`, `enemiesInRange(range: SkillRange): EnemyUnit[]`, `resetAllUnits(): void`

- [ ] **Step 1: เขียน test ที่ยัง fail**

สร้าง `app/Test/automated/Simulator/BattleField.test.ts`:

```ts
import { BattleField } from '../../../Simulator/BattleField';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { EnemyPosition, SkillRange, StatsType } from '../../../Constants/Enum';

function makeEnemy(name: string, position: EnemyPosition): EnemyUnit {
    const e = new EnemyUnit(name);
    e.position = position;
    return e;
}

describe('BattleField', () => {
    let field: BattleField;

    beforeEach(() => {
        field = new BattleField();
    });

    // ─────────────────────────────────────────────
    // สร้างใหม่ต้องว่างเปล่าเสมอ
    // ─────────────────────────────────────────────
    describe('initial state', () => {
        it('should start with empty allies', () => {
            expect(field.allies).toEqual([]);
        });

        it('should start with empty enemies', () => {
            expect(field.enemies).toEqual([]);
        });
    });

    // ─────────────────────────────────────────────
    // createEnemy
    // ─────────────────────────────────────────────
    describe('createEnemy', () => {
        it('should return an EnemyUnit with the given name', () => {
            const enemy = field.createEnemy('Boss');
            expect(enemy).toBeInstanceOf(EnemyUnit);
            expect(enemy.name).toBe('Boss');
        });

        it('should push the created enemy into enemies', () => {
            const enemy = field.createEnemy('Boss');
            expect(field.enemies).toEqual([enemy]);
        });

        it('should accumulate multiple enemies in creation order', () => {
            const a = field.createEnemy('A');
            const b = field.createEnemy('B');
            expect(field.enemies).toEqual([a, b]);
        });
    });

    // ─────────────────────────────────────────────
    // enemiesInRange — logic เดิมที่ย้ายมาจาก Damage.ts
    // ─────────────────────────────────────────────
    describe('enemiesInRange', () => {
        let van: EnemyUnit;
        let mid: EnemyUnit;
        let rear: EnemyUnit;
        let out: EnemyUnit;

        beforeEach(() => {
            van  = makeEnemy('Van',  EnemyPosition.Vanguard);   // "0"
            mid  = makeEnemy('Mid',  EnemyPosition.Midrange);   // "1"
            rear = makeEnemy('Rear', EnemyPosition.Rearguard);  // "2"
            out  = makeEnemy('Out',  EnemyPosition.OutOfRange); // "3"
            field.enemies = [van, mid, rear, out];
        });

        it('Contact (1) should hit only Vanguard', () => {
            expect(field.enemiesInRange(SkillRange.Contact)).toEqual([van]);
        });

        it('Midrange (2) should hit Vanguard and Midrange', () => {
            expect(field.enemiesInRange(SkillRange.Midrange)).toEqual([van, mid]);
        });

        it('Ranged (3) should hit Vanguard, Midrange, and Rearguard', () => {
            expect(field.enemiesInRange(SkillRange.Ranged)).toEqual([van, mid, rear]);
        });

        it('Global (999) should hit all positions including OutOfRange', () => {
            expect(field.enemiesInRange(SkillRange.Global)).toEqual([van, mid, rear, out]);
        });

        it('None (0) should hit no enemies', () => {
            expect(field.enemiesInRange(SkillRange.None)).toEqual([]);
        });

        it('should not mutate enemies', () => {
            field.enemiesInRange(SkillRange.Contact);
            expect(field.enemies).toEqual([van, mid, rear, out]);
        });
    });

    // ─────────────────────────────────────────────
    // resetAllUnits
    // ─────────────────────────────────────────────
    describe('resetAllUnits', () => {
        it('should reset ally stats back to their default values', () => {
            const ally = new AllyUnit('Ally');
            ally.setDefaultStat(StatsType.AtkP, 10);
            ally.setStat(StatsType.AtkP, 50);
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.getStats(StatsType.AtkP)).toBe(10);
        });

        it('should reset enemy stats back to their default values', () => {
            const enemy = field.createEnemy('Boss');
            enemy.setStat(StatsType.Res, 99);

            field.resetAllUnits();

            // EnemyUnit constructor ตั้ง defaultStats ของ Res ไว้ที่ 10
            expect(enemy.getStats(StatsType.Res)).toBe(10);
        });

        it('should zero out stats that have no default value', () => {
            const ally = new AllyUnit('Ally');
            ally.setStat(StatsType.CR, 0.75);
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.getStats(StatsType.CR)).toBe(0);
        });
    });

    // ─────────────────────────────────────────────
    // Isolation — หัวใจของ refactor นี้
    // พิสูจน์ว่าบั๊ก state รั่วข้าม simulation ตายแล้วจริง
    // ─────────────────────────────────────────────
    describe('isolation between instances', () => {
        it('should not share enemies between two BattleFields', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            const bossA = fieldA.createEnemy('BossA');
            const bossB = fieldB.createEnemy('BossB');

            expect(fieldA.enemies).toEqual([bossA]);
            expect(fieldB.enemies).toEqual([bossB]);
        });

        it('should not share allies between two BattleFields', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            fieldA.allies.push(new AllyUnit('AllyA'));

            expect(fieldA.allies.length).toBe(1);
            expect(fieldB.allies.length).toBe(0);
        });

        it('enemiesInRange should only see its own enemies', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            const vanA = makeEnemy('VanA', EnemyPosition.Vanguard);
            const vanB = makeEnemy('VanB', EnemyPosition.Vanguard);
            fieldA.enemies = [vanA];
            fieldB.enemies = [vanB];

            expect(fieldA.enemiesInRange(SkillRange.Global)).toEqual([vanA]);
            expect(fieldB.enemiesInRange(SkillRange.Global)).toEqual([vanB]);
        });
    });
});
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

```bash
npx jest app/Test/automated/Simulator/BattleField.test.ts
```

Expected: FAIL — `BattleField` ไม่ถูก export จาก `app/Simulator/BattleField.ts` (TS2305 / "has no exported member 'BattleField'")

- [ ] **Step 3: เพิ่ม class ลงใน `app/Simulator/BattleField.ts`**

แทนที่ทั้งไฟล์ด้วยเนื้อหานี้ — class ใหม่อยู่ด้านบน ส่วนของเดิม (`battleField`, `createEnemy`, `resetAllUnits`) คงไว้ด้านล่างพร้อมหมายเหตุว่าเป็น deprecated ชั่วคราว จะถูกลบใน Task 4:

```ts
import type { AllyUnit } from "../Models/AllyUnit";
import { EnemyUnit } from "../Models/EnemyUnit";
import { SkillRange } from "../Constants/Enum";

/**
 * BattleField — เก็บ ally/enemy ทั้งหมดในสนามตอนนี้
 * 1 instance = 1 การต่อสู้ ที่แยกขาดจากกันสมบูรณ์ (CombatTimeline เป็นเจ้าของ)
 */
export class BattleField {
    public allies : AllyUnit[]  = [];
    public enemies: EnemyUnit[] = [];

    /** สร้าง EnemyUnit (stats พื้นฐาน default อยู่แล้วใน class) แล้ว push เข้า enemies ให้เลย */
    public createEnemy(name: string): EnemyUnit {
        const enemy = new EnemyUnit(name);
        this.enemies.push(enemy);
        return enemy;
    }

    /**
     * กรอง enemies ที่อยู่ในระยะของท่า — position น้อยกว่า range ถือว่าโดน
     * SkillRange.None = "0" จึงคืน array ว่างเสมอ (ไม่มี position ไหนน้อยกว่า 0)
     */
    public enemiesInRange(range: SkillRange): EnemyUnit[] {
        return this.enemies.filter(e => Number(e.position) < Number(range));
    }

    /** เรียกก่อนเริ่ม simulate รอบใหม่ — reset stats ของทุก unit กลับค่า default */
    public resetAllUnits(): void {
        for (const unit of [...this.allies, ...this.enemies]) {
            unit.initDefaultStats();
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ⚠️ ของเดิม (global singleton) — เหลือไว้ชั่วคราวให้ Damage.ts ที่ยังไม่ย้าย compile ผ่าน
//    จะถูกลบทิ้งใน Task 4 ของแผน refactor นี้ ห้ามเขียนโค้ดใหม่ที่ใช้ของพวกนี้
// ─────────────────────────────────────────────────────────────
export const battleField: {
    allies : AllyUnit[];
    enemies: EnemyUnit[];
} = {
    allies : [],
    enemies: [],
};

export function createEnemy(name: string): EnemyUnit {
    const enemy = new EnemyUnit(name);
    battleField.enemies.push(enemy);
    return enemy;
}

export function resetAllUnits(): void {
    for (const unit of [...battleField.allies, ...battleField.enemies]) {
        unit.initDefaultStats();
    }
}
```

หมายเหตุ: `AllyUnit` ใช้เป็น type อย่างเดียวจึงใช้ `import type` — จำเป็นเพราะ Task 2 จะให้
`AllyUnit.ts` import `BattleField` กลับมา ถ้าเป็น value import ทั้งสองฝั่งจะเกิด circular import
ตอน runtime (`import type` ถูกลบทิ้งตอน compile จึงไม่มี cycle จริง)

- [ ] **Step 4: รัน test ให้ผ่าน**

```bash
npx jest app/Test/automated/Simulator/BattleField.test.ts
```

Expected: PASS ทั้งหมด

- [ ] **Step 5: รัน test ทั้งหมดเพื่อยืนยันว่าไม่พังของเดิม**

```bash
npm test
```

Expected: PASS ทุก suite (suite เดิม + `BattleField.test.ts` ที่เพิ่มมา)

- [ ] **Step 6: Commit**

```bash
git add app/Simulator/BattleField.ts WuwaSimulator/app/Test/automated/Simulator/BattleField.test.ts
git commit -m "feat : BattleField class + test (ยังไม่ลบ global เดิม)"
```

---

### Task 2: `CombatTimeline` เป็นเจ้าของ `BattleField` + `TimelineRef`

**Files:**
- Modify: `app/Simulator/CombatTimeline.ts` (เพิ่ม import + field ถัดจาก `triggerBus` บรรทัด 28)
- Modify: `app/Models/AllyUnit.ts` (เพิ่ม import type + field ใน `TimelineRef` บรรทัด 11-19)
- Test: `app/Test/automated/Simulator/CombatTimeline.test.ts` (สร้างใหม่)

**Interfaces:**
- Consumes: `BattleField` จาก Task 1
- Produces: `CombatTimeline.battleField: BattleField` (public field), `TimelineRef.battleField: BattleField` (readonly)

- [ ] **Step 1: เขียน test ที่ยัง fail**

สร้าง `app/Test/automated/Simulator/CombatTimeline.test.ts`:

```ts
import { CombatTimeline } from '../../../Simulator/CombatTimeline';
import { BattleField } from '../../../Simulator/BattleField';

describe('CombatTimeline — battleField ownership', () => {
    it('should own a BattleField instance', () => {
        const timeline = new CombatTimeline();
        expect(timeline.battleField).toBeInstanceOf(BattleField);
    });

    it('should start with an empty battleField', () => {
        const timeline = new CombatTimeline();
        expect(timeline.battleField.enemies).toEqual([]);
        expect(timeline.battleField.allies).toEqual([]);
    });

    // นี่คือ test ที่พิสูจน์ว่าปัญหา state รั่วข้าม simulation หายไปจริง
    it('should not share battleField between two timelines', () => {
        const timelineA = new CombatTimeline();
        const timelineB = new CombatTimeline();

        const bossA = timelineA.battleField.createEnemy('BossA');

        expect(timelineA.battleField.enemies).toEqual([bossA]);
        expect(timelineB.battleField.enemies).toEqual([]);
    });
});
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

```bash
npx jest app/Test/automated/Simulator/CombatTimeline.test.ts
```

Expected: FAIL — `Property 'battleField' does not exist on type 'CombatTimeline'` (TS2339)

- [ ] **Step 3: เพิ่ม field ใน `CombatTimeline`**

ใน `app/Simulator/CombatTimeline.ts` เพิ่ม import ต่อจากบรรทัด `import { TriggerBus } from "./TriggerBus";`:

```ts
import { BattleField } from "./BattleField";
```

แล้วเพิ่ม field ต่อจาก `triggerBus` (บรรทัด 28):

```ts
    /** รวม listener ของทุกตัวละคร — emit ตอน action ใดๆ trigger event กลาง (เช่น energy เพิ่ม) */
    public triggerBus: TriggerBus = new TriggerBus();

    /** ally/enemy ทั้งหมดของการต่อสู้นี้ — 1 timeline = 1 สนามรบ ไม่แชร์กับ timeline อื่น */
    public battleField: BattleField = new BattleField();
```

- [ ] **Step 4: เพิ่ม `battleField` ใน `TimelineRef`**

ใน `app/Models/AllyUnit.ts` เพิ่ม import ต่อจากบรรทัด 6 (`import type { TriggerBus } ...`):

```ts
import type { BattleField } from "../Simulator/BattleField";
```

แล้วเพิ่ม field ใน `TimelineRef` (ถัดจาก `readonly triggerBus`):

```ts
/** Structural type — หลีกเลี่ยง circular import กับ CombatTimeline */
export type TimelineRef = {
    schedule(event: CombatEvent, offset?: number): void;
    scheduleStartCombo(event: ActionEvent, duration?: number, autoStartFrame?: number, offset?: number): void;
    scheduleBuffStart(event: BuffStartEvent, duration?: number, offset?: number): void;
    readonly currentFrame: number;
    readonly triggerBus: TriggerBus;
    readonly battleField: BattleField;
    readonly onFieldChar: AllyUnit | null;
    isGlobalLocked: boolean;
};
```

- [ ] **Step 5: รัน test ให้ผ่าน**

```bash
npx jest app/Test/automated/Simulator/CombatTimeline.test.ts
```

Expected: PASS ทั้ง 3 test

- [ ] **Step 6: ยืนยันว่า `CombatTimeline` ยังเข้ากันได้กับ `TimelineRef`**

```bash
npm test
```

Expected: PASS ทุก suite — ถ้า `TimelineRef` กับ `CombatTimeline` ไม่ตรงกัน จุดที่จะ error คือ
`manualBuilder.ts` ที่ส่ง `timeline` เข้า rotation factory (`test1.rotations.get("Burst")!(timeline)`)
แต่ไฟล์นั้นไม่ได้อยู่ใน test — จึงต้องเช็คด้วย step ถัดไป

- [ ] **Step 7: ยืนยันว่า entry point ยังรันได้**

```bash
npm start
```

Expected: รันจบและ print `=== Combat End (frame=..., t=...s, loops completed=2) ===` โดยไม่มี TypeScript error

- [ ] **Step 8: Commit**

```bash
git add app/Simulator/CombatTimeline.ts WuwaSimulator/app/Models/AllyUnit.ts WuwaSimulator/app/Test/automated/Simulator/CombatTimeline.test.ts
git commit -m "feat : CombatTimeline ถือ BattleField instance + เพิ่มใน TimelineRef"
```

---

### Task 3: `Damage` ตัด overload `SkillRange` และเลิก import global

**Files:**
- Modify: `app/Models/Combat/Damage.ts` (ลบ import บรรทัด 4, ลบ overload บรรทัด 118-126, แก้ constructor body บรรทัด 128-153)
- Modify: `app/Test/automated/Models/Damage.test.ts` (ลบ import บรรทัด 5, แก้ import บรรทัด 4, ลบ describe block บรรทัด 109-161)

**Interfaces:**
- Consumes: `BattleField.enemiesInRange()` จาก Task 1 (ใช้โดยคนเรียก `Damage` ไม่ใช่โดย `Damage` เอง)
- Produces: `Damage` constructor เหลือ signature เดียว — `(attacker: AllyUnit, name: string, attackType: ActionType | ActionType[], target: EnemyUnit | EnemyUnit[], energyGain?: number, concentoEnergyGain?: number)`

- [ ] **Step 1: ลบ test ชุด `SkillRange` ออกจาก `Damage.test.ts`**

test พวกนี้ย้ายไปอยู่ที่ `BattleField.test.ts` แล้วใน Task 1 (`describe('enemiesInRange')`)
ซึ่งครอบคลุมทุก tier เหมือนกันเป๊ะ จึงลบทิ้งได้โดยไม่เสีย coverage

1. ลบทั้ง block `describe('constructor: SkillRange', () => { ... });` (บรรทัด 109-161 รวม comment
   หัวข้อ `// Constructor — SkillRange` ด้านบน)
2. แทนที่บรรทัด `import { battleField } from '../../../Simulator/BattleField';` ด้วย:

```ts
import { BattleField } from '../../../Simulator/BattleField';
```

3. บรรทัด import enum (บรรทัด 4) **ไม่ต้องแก้** — `SkillRange` ยังถูกใช้ต่อใน test ชุดใหม่ที่จะเพิ่มใน Step 3

- [ ] **Step 2: รัน test ยืนยันว่ายังเขียวอยู่**

```bash
npx jest app/Test/automated/Models/Damage.test.ts
```

Expected: PASS — test ที่เหลือทั้งหมดยังผ่าน (ตอนนี้ `Damage.ts` ยังมี overload `SkillRange` อยู่
แต่ไม่มีใครเรียกแล้ว) นี่คือ step ที่พิสูจน์ว่าการลบ test ไม่ได้ทำให้ของอื่นพัง

- [ ] **Step 3: เพิ่ม test ที่ยืนยันว่า `Damage` ทำงานกับผลจาก `enemiesInRange()` ได้**

เพิ่ม describe block นี้ต่อท้าย block `describe('constructor: EnemyUnit[] targets', ...)`
ใน `Damage.test.ts` — import ที่ต้องใช้ (`BattleField`, `SkillRange`) มีครบแล้วจาก Step 1:

```ts
    // ─────────────────────────────────────────────
    // ใช้ร่วมกับ BattleField.enemiesInRange() — pattern ที่ rotation จะเรียกจริง
    // ─────────────────────────────────────────────
    describe('constructor: targets from BattleField.enemiesInRange', () => {
        it('should take exactly the enemies returned by enemiesInRange', () => {
            const field = new BattleField();
            const van   = makeEnemy('Van', EnemyPosition.Vanguard);
            const mid   = makeEnemy('Mid', EnemyPosition.Midrange);
            field.enemies = [van, mid];

            const d = new Damage(attacker, 'BA', ActionType.BA, field.enemiesInRange(SkillRange.Contact));

            expect(d.targets).toEqual([van]);
        });

        it('should accept an empty result without error', () => {
            const field = new BattleField();

            const d = new Damage(attacker, 'BA', ActionType.BA, field.enemiesInRange(SkillRange.Global));

            expect(d.targets).toEqual([]);
        });
    });
```

- [ ] **Step 4: รัน test ให้เห็นว่าผ่าน (ยังใช้โค้ดเดิมอยู่)**

```bash
npx jest app/Test/automated/Models/Damage.test.ts
```

Expected: PASS — เพราะ overload `EnemyUnit[]` เดิมรองรับอยู่แล้ว test นี้เป็นตัวล็อกพฤติกรรม
ไว้ก่อนจะไปแก้ `Damage.ts` ใน step ถัดไป (ถ้าแก้แล้วพัง test ชุดนี้จะจับได้ทันที)

- [ ] **Step 5: แก้ `Damage.ts` — ลบ import และ overload `SkillRange`**

1. ลบบรรทัด 4: `import { battleField } from "../../Simulator/BattleField";`
2. แก้บรรทัด 1 เอา `SkillRange` ออกจาก import (ไม่มีใครใช้แล้วในไฟล์นี้):

```ts
import { ActionType, ElementType, MultiplierType } from "../../Constants/Enum";
```

3. แทนที่ทั้ง 2 overload declaration + implementation (บรรทัด 108-153) ด้วยตัวเดียวนี้:

```ts
    /**
     * target รับได้ทั้ง unit เดียวและหลาย unit
     * ถ้าอยากยิงตาม SkillRange ให้กรองจาก battleField ก่อนแล้วค่อยส่งเข้ามา:
     *   new Damage(unit, "BA1", ActionType.BA, timeline.battleField.enemiesInRange(SkillRange.Contact))
     */
    constructor(
        attacker   : AllyUnit,
        name       : string,
        attackType : ActionType | ActionType[],
        target     : EnemyUnit | EnemyUnit[],
        energyGain?: number,
        concentoEnergyGain?: number
    ) {
        this.attacker       = attacker;
        this.name           = name;
        this.element        = attacker.elementType;
        this.attackTypeList = Array.isArray(attackType) ? attackType : [attackType];
        this.energyGain         = energyGain;
        this.concentoEnergyGain = concentoEnergyGain;

        this.targets = Array.isArray(target) ? target : [target];
    }
```

- [ ] **Step 6: รัน test ทั้งหมด**

```bash
npm test
```

Expected: PASS ทุก suite

- [ ] **Step 7: ยืนยันว่า `Damage.ts` ไม่ import อะไรจาก `Simulator/` แล้ว**

```bash
npx rg "Simulator" app/Models/Combat/Damage.ts
```

Expected: ไม่มีผลลัพธ์ (exit code 1)

- [ ] **Step 8: Commit**

```bash
git add app/Models/Combat/Damage.ts WuwaSimulator/app/Test/automated/Models/Damage.test.ts
git commit -m "refactor : Damage ตัด overload SkillRange เลิกพึ่ง battleField global"
```

---

### Task 4: ลบ global เดิมทิ้ง + verify ปิดงาน

**Files:**
- Modify: `app/Simulator/BattleField.ts` (ลบ `battleField` const, `createEnemy()`, `resetAllUnits()` ที่เป็น free function ท้ายไฟล์)

**Interfaces:**
- Consumes: ทุกอย่างจาก Task 1-3
- Produces: `app/Simulator/BattleField.ts` export เฉพาะ `class BattleField`

- [ ] **Step 1: ยืนยันว่าไม่มีใครใช้ของเดิมแล้ว**

```bash
npx rg "\{ battleField|createEnemy|resetAllUnits" app --glob "!**/BattleField.ts"
```

Expected: ไม่มีผลลัพธ์ที่เป็นการเรียกใช้ free function/const เดิม — ถ้ายังมี ให้แก้จุดนั้นให้ไปใช้
`timeline.battleField.<method>()` ก่อนแล้วค่อยทำ step ถัดไป

- [ ] **Step 2: ลบของเดิมออกจาก `app/Simulator/BattleField.ts`**

ลบตั้งแต่ comment `// ⚠️ ของเดิม (global singleton) ...` ลงไปจนจบไฟล์ เหลือแค่ import 3 บรรทัดกับ
`export class BattleField { ... }` เท่านั้น

- [ ] **Step 3: รัน test ทั้งหมด**

```bash
npm test
```

Expected: PASS ทุก suite — ถ้ามี suite ไหน fail แปลว่ายังมีคนอ้างถึงของเดิมอยู่ ให้ย้อนไป Step 1

- [ ] **Step 4: ยืนยันว่าไม่เหลือ global ในโค้ดเลย**

```bash
npx rg "import \{ battleField" app
```

Expected: ไม่มีผลลัพธ์ (exit code 1)

- [ ] **Step 5: ยืนยันว่า entry point ยังรันได้**

```bash
npm start
```

Expected: รันจบและ print `=== Combat End (frame=..., t=...s, loops completed=2) ===` โดยไม่มี error

- [ ] **Step 6: Commit**

```bash
git add app/Simulator/BattleField.ts
git commit -m "refactor : ลบ battleField global singleton ทิ้ง เหลือแค่ class BattleField"
```

---

### Task 5: อัปเดต `CLAUDE.md` ให้ตรงกับโค้ดใหม่

เอกสารเป็นสิ่งที่ session ถัดไปอ่านเป็นอย่างแรก ถ้าไม่อัปเดตจะเข้าใจผิดว่า `battleField` ยังเป็น global อยู่

**Files:**
- Modify: `CLAUDE.md` (ส่วน "Global Battle State", ผังโครงสร้างโปรเจกต์, "ข้อควรระวัง / Known issues")

**Interfaces:**
- Consumes: ผลลัพธ์สุดท้ายจาก Task 1-4
- Produces: ไม่มี (เอกสารล้วน)

- [ ] **Step 1: แก้หัวข้อ "Global Battle State (`Simulator/BattleField.ts`)"**

เปลี่ยนชื่อหัวข้อเป็น `## Battle State (Simulator/BattleField.ts)` แล้วแทนเนื้อหาทั้งหัวข้อด้วย:

```markdown
- `BattleField` เป็น **class** — 1 instance = 1 การต่อสู้ ไม่ใช่ global singleton แล้ว
- `CombatTimeline` เป็นเจ้าของ: `public battleField: BattleField = new BattleField()` (สร้างใน field initializer เหมือน `triggerBus`) → `new CombatTimeline()` 1 ครั้ง = สนามรบใหม่ที่แยกขาด ไม่มี state รั่วข้ามรอบ simulate หรือข้าม test case อีก
- method: `createEnemy(name)` สร้าง+push เข้า `enemies` / `enemiesInRange(range)` กรอง `enemies` ที่ `position < range` / `resetAllUnits()` วน unit ทุกตัวเรียก `initDefaultStats()`
- `TimelineRef` มี `readonly battleField: BattleField` — rotation เข้าถึงผ่าน `timeline.battleField` ได้เลย (ใช้ `import type` เลี่ยง circular import แบบเดียวกับ `TriggerBus`)
- `Damage` **ไม่รู้จัก `BattleField` แล้ว** — รับเฉพาะ `EnemyUnit | EnemyUnit[]` คนเรียกกรองเองก่อน: `new Damage(unit, "BA1", ActionType.BA, timeline.battleField.enemiesInRange(SkillRange.Contact))`
```

- [ ] **Step 2: แก้ผังโครงสร้างโปรเจกต์**

ในบล็อกผังโฟลเดอร์ แก้บรรทัดของ `BattleField.ts` เป็น:

```
│   ├── BattleField.ts              # class BattleField (allies/enemies + createEnemy/enemiesInRange/resetAllUnits) — CombatTimeline ถือไว้ 1 ตัวต่อ 1 การต่อสู้
```

และแก้บรรทัดของ `Damage.ts` เป็น:

```
│       ├── Damage.ts                # Data object ล้วน — รับ target เป็น EnemyUnit|EnemyUnit[] เท่านั้น ไม่ import อะไรจาก Simulator/
```

- [ ] **Step 3: ลบ known issue ที่ตายแล้ว**

ในหัวข้อ "ข้อควรระวัง / Known issues" ลบ 2 bullet นี้ทิ้ง (ไม่เป็นความจริงแล้ว):
- bullet ที่ขึ้นต้นว่า `⚠️ ยังไม่มีจุดไหนใน manualBuilder.ts เรียก createEnemy()...` (อยู่ในหัวข้อ Global Battle State)
- bullet ที่ขึ้นต้นว่า `⚠️ battleField ไม่ถูก reset ระหว่างรัน simulate หลายรอบในโปรเซสเดียว...`

- [ ] **Step 4: อัปเดตจำนวน test suite**

ในผังโฟลเดอร์ตรง `Test/automated/` แก้ `8 suite / 100 tests` ให้ตรงกับผลจริง โดยอ่านตัวเลขจาก:

```bash
npm test
```

แล้วดูบรรทัดสรุปท้าย output (`Tests: X passed` / `Test Suites: Y passed`) — ใส่ตัวเลขจริงลงไป
ห้ามเดา และเพิ่ม `BattleField.test.ts` / `CombatTimeline.test.ts` เข้าไปในรายการใต้ `Simulator/`

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs : อัปเดต CLAUDE.md ตาม BattleField instance refactor"
```

---

## Self-Review

**Spec coverage** — เทียบกับ spec ทีละหัวข้อ:

| หัวข้อใน spec | Task ที่ทำ |
|---|---|
| `BattleField` เป็น class (`allies`/`enemies`/`createEnemy`/`enemiesInRange`/`resetAllUnits`) | Task 1 |
| `enemiesInRange` คงพฤติกรรม `SkillRange.None` เดิม | Task 1 Step 1 (test `None (0) should hit no enemies`) |
| `CombatTimeline` สร้างใน field initializer | Task 2 Step 3 |
| `Damage` ลบ import + ลบ overload `SkillRange` | Task 3 Step 5 |
| `TimelineRef` เพิ่ม `readonly battleField` | Task 2 Step 4 |
| circular import แก้ด้วย `import type` | Task 1 Step 3 (หมายเหตุ) + Task 2 Step 4 |
| `Damage.test.ts` ย้าย test range ออก + ลบ cleanup มือ | Task 3 Step 1 |
| test isolation ระหว่าง 2 instance | Task 1 Step 1 + Task 2 Step 1 |
| `manualBuilder.ts` ไม่ต้องแก้ | ยืนยันด้วย `npm start` ใน Task 2 Step 7 และ Task 4 Step 5 |
| ไม่เพิ่ม `createAlly()` / ไม่แตะ known issue อื่น | ไม่มี task ไหนทำ (ตั้งใจ) |

**หมายเหตุที่ต่างจาก spec:** spec เขียนว่า "ไม่อัปเดต `CLAUDE.md`" แต่แผนนี้เพิ่ม Task 5 เข้ามา
เพราะถ้าปล่อยไว้ เอกสารจะบอกข้อมูลผิดกับ session ถัดไปทันทีที่ refactor จบ — เป็น task แยก commit
แยก จึงไม่ปนกับ diff ของโค้ดตามเจตนาเดิมของ spec

**Placeholder scan:** ไม่มี TBD/TODO, ทุก step ที่ต้องแก้โค้ดมี code block จริง, ทุกคำสั่งรันได้ตรงๆ

**Type consistency:** `enemiesInRange(range: SkillRange): EnemyUnit[]` ใช้ชื่อเดียวกันทุก task
(Task 1 นิยาม, Task 3 Step 3 เรียก, Task 5 Step 1 เขียนในเอกสาร) — `battleField` เป็นชื่อ field
เดียวกันทั้งใน `CombatTimeline` และ `TimelineRef`
