import { BattleField } from '../../../Simulator/BattleField';
import { AllyUnit } from '../../../Models/AllyUnit';
import { Simulate } from '../../../Simulator/Simulate';
import { RotationBuilder } from '../../../Simulator/RotationBuilder';
import { SwapCharacterEvent } from '../../../Models/Combat/CombatEvent/SwapCharacterEvent';
import { AttackActionEvent } from '../../../Models/Combat/CombatEvent/AttackActionEvent';
import { ActionType } from '../../../Constants/Enum';

describe('SwapCharacterEvent', () => {
    describe('constructor', () => {
        it('should default to a normal swap when given nothing', () => {
            const event = new SwapCharacterEvent();

            expect(event.isTempSwap).toBe(0);
            expect(event.name).toBe('SwapCharacter');
        });

        it('should stay a normal swap when given 0', () => {
            const event = new SwapCharacterEvent(0);

            expect(event.isTempSwap).toBe(0);
            expect(event.name).toBe('SwapCharacter');
        });

        it('should become a temp swap when given 1', () => {
            const event = new SwapCharacterEvent(1);

            expect(event.isTempSwap).toBe(1);
            expect(event.name).toBe('TempSwapCharacter');
        });

        // ชื่อคือ key ของ IPQ — ขาแวะกับขากลับที่อยู่ frame ใกล้กันต้องไม่ชนกันเอง
        it('should let a temp swap and a normal swap coexist in the queue', () => {
            const field = new BattleField();

            field.schedule(new SwapCharacterEvent(1));
            field.schedule(new SwapCharacterEvent(0), 30);

            expect(field.size).toBe(2);
        });
    });

    describe('execute', () => {
        let field: BattleField;
        let a: AllyUnit;
        let b: AllyUnit;
        let c: AllyUnit;

        beforeEach(() => {
            field = new BattleField();
            a     = new AllyUnit('A');
            b     = new AllyUnit('B');
            c     = new AllyUnit('C');

            field.allies.push(a, b, c);
            field.onFieldChar = a;

            // ค่าเริ่มต้น: concento เต็มทุกตัว — เทสที่ไม่ได้ตั้งใจเทสเรื่อง concento โดยตรง
            // จะได้ไม่โดนบล็อกจากกติกา "สลับปกติต้อง concento เต็ม"
            for (const ally of [a, b, c]) {
                ally.concentoEnergy = ally.maxConcentoEnergy;
            }
        });

        // ลำดับสำคัญ: ปิดคิวตัวที่ยืนอยู่ก่อน แล้วค่อยเลือกตัวถัดไป
        it('should close the current turn before picking the next character', () => {
            field.schedule(new SwapCharacterEvent());
            field.tick();

            expect(a.rotationCount).toBe(1);
            expect(field.onFieldChar).toBe(b);
        });

        it('should not close the turn on a temp swap', () => {
            field.schedule(new SwapCharacterEvent(1));
            field.tick();

            expect(a.rotationCount).toBe(0);
            expect(field.onFieldChar).toBe(a);   // a ยังถึงคิวอยู่ จึงถูกหยิบกลับมาเอง
        });

        it('should skip allies that already went this round', () => {
            b.rotationCount = 1;                 // b ออกไปแล้ว

            field.schedule(new SwapCharacterEvent());
            field.tick();

            expect(field.onFieldChar).toBe(c);
        });

        // สั่ง swap เกินโควตา (ทุกตัวออกครบรอบแล้ว) = rotation เขียนผิด ต้องดังทันที
        it('should throw when swapped more times than the team size allows', () => {
            a.rotationCount = 1;
            b.rotationCount = 1;
            c.rotationCount = 2;             // c ยืนอยู่ เดี๋ยวโดน bump เป็น 3
            field.onFieldChar = c;

            field.schedule(new SwapCharacterEvent());

            expect(() => field.tick()).toThrow(/ไม่มีตัวละครที่ถึงคิว/);
        });

        it('should do nothing when the team is empty', () => {
            const empty = new BattleField();

            empty.schedule(new SwapCharacterEvent());

            expect(() => empty.tick()).not.toThrow();
        });

        it('should follow the field rotationCount when the round moves on', () => {
            a.rotationCount = 2;
            b.rotationCount = 1;
            c.rotationCount = 1;
            field.rotationCount = 1;
            field.onFieldChar = a;

            field.schedule(new SwapCharacterEvent());
            field.tick();

            expect(field.onFieldChar).toBe(b);
        });

        // สลับปกติต้องรอ concento เต็มก่อนเสมอ ไม่งั้นดังทันทีเพื่อกันรอบ simulate เดินต่อทั้งที่ยังไม่ครบเงื่อนไข
        it('should throw on a normal swap when the current character\'s concento is not full', () => {
            a.maxConcentoEnergy = 100;
            a.concentoEnergy = 99;

            field.schedule(new SwapCharacterEvent());

            expect(() => field.tick()).toThrow(/concento/);
        });

        it('should not throw on a normal swap when the current character\'s concento is full', () => {
            a.maxConcentoEnergy = 100;
            a.concentoEnergy = 100;

            field.schedule(new SwapCharacterEvent());

            expect(() => field.tick()).not.toThrow();
            expect(field.onFieldChar).toBe(b);
        });

        it('should not throw on a temp swap even when concento is not full', () => {
            a.maxConcentoEnergy = 100;
            a.concentoEnergy = 0;

            field.schedule(new SwapCharacterEvent(1));

            expect(() => field.tick()).not.toThrow();
        });
    });

    // เทสระดับ Director — เคสที่ unit test ข้างบนจับไม่ได้ เพราะ battleField.rotationCount
    // ขยับจากฝั่ง Director สวนทางกับจังหวะที่ swap event รัน
    describe('driven by RotationDirector', () => {
        // action ต้องทำท่าจริงก่อนค่อยสลับเสมอ (ห้าม action ที่มีแต่การสลับตัวเฉยๆ — ดู CLAUDE.md)
        // ไม่งั้น swap ที่ rotation สั่งเองจะไปชนกับ swap ปิดรอบก่อนหน้าที่ endRotation() เพิ่ง
        // schedule ไว้ในสเต็ปเดียวกัน (ชื่อ "SwapCharacter" ซ้ำกัน โดน update() ทับกันเอง)
        it('should rotate through the whole team once per round', () => {
            const sim = new Simulate();
            const a = sim.addAlly(new AllyUnit('A'));
            const b = sim.addAlly(new AllyUnit('B'));
            const c = sim.addAlly(new AllyUnit('C'));

            const field = sim.battleField;
            const seen: string[] = [];

            // resetAllUnits() ล้าง concentoEnergy กลับ 0 ทุกครั้งที่ sim.run() เริ่มรอบใหม่ —
            // ต้องเติมเต็มให้ตัวที่กำลังจะออกก่อนเกิด swap ปกติเสมอ (ที่นี่เติมตอนตัวเองลงมือ)
            const attack = (unit: AllyUnit, name: string, thenSwap: boolean) => () => {
                unit.concentoEnergy = unit.maxConcentoEnergy;
                const event = new AttackActionEvent(`${name}-f${field.currentFrame}`, unit, ActionType.BA);
                if (thenSwap) field.appendOnExecute(event, () => field.schedule(new SwapCharacterEvent()));
                field.scheduleStartOnFieldAction(event, 10);
            };

            const loop = new RotationBuilder()
                .add('a1', attack(a, 'A1', true))
                .add('a2', attack(b, 'A2', true))
                .add('a3', attack(c, 'A3', false))   // N-1 = 2 ครั้ง
                .build();

            const originalTick = field.tick.bind(field);
            field.tick = () => {
                const event = originalTick();
                if (event?.name.includes('Swap')) seen.push(field.onFieldChar!.name);
                return event;
            };

            sim.run(new RotationBuilder().build(), loop, 2);

            expect(seen).toEqual(['B', 'C', 'A', 'B', 'C', 'A']);
        });

        it('should leave every ally on the same rotationCount after a full round', () => {
            const sim = new Simulate();
            const a = sim.addAlly(new AllyUnit('A'));
            const b = sim.addAlly(new AllyUnit('B'));
            const c = sim.addAlly(new AllyUnit('C'));

            const field = sim.battleField;

            const attack = (unit: AllyUnit, name: string, thenSwap: boolean) => () => {
                unit.concentoEnergy = unit.maxConcentoEnergy;
                const event = new AttackActionEvent(`${name}-f${field.currentFrame}`, unit, ActionType.BA);
                if (thenSwap) field.appendOnExecute(event, () => field.schedule(new SwapCharacterEvent()));
                field.scheduleStartOnFieldAction(event, 10);
            };

            sim.run(
                new RotationBuilder().build(),
                new RotationBuilder()
                    .add('a1', attack(a, 'A1', true))
                    .add('a2', attack(b, 'A2', true))
                    .add('a3', attack(c, 'A3', false))
                    .build(),
                2,
            );

            expect([a.rotationCount, b.rotationCount, c.rotationCount]).toEqual([2, 2, 2]);
        });

        // ซีนเดียวกับ manualBuilder.ts: ทีม 2 คน คนละ 2 ท่า คั่นด้วย swap 1 ครั้ง (N-1)
        // ท่าสุดท้ายของรอบต้องได้ออกก่อน swap ปิดท้าย ไม่ใช่หลัง
        it('should let the last action of the round run before the closing swap', () => {
            const sim   = new Simulate();
            const a     = sim.addAlly(new AllyUnit('A'));
            const b     = sim.addAlly(new AllyUnit('B'));
            const field = sim.battleField;

            const attack = (unit: AllyUnit, name: string) => () => {
                unit.concentoEnergy = unit.maxConcentoEnergy;
                field.scheduleStartOnFieldAction(
                    new AttackActionEvent(`${name}-f${field.currentFrame}`, unit, ActionType.BA),
                    30,
                );
            };

            const setup = new RotationBuilder()
                .add('a1', attack(a, 'A1'))
                .add('a2', attack(a, 'A2'))
                .add('swap', () => field.schedule(new SwapCharacterEvent()))
                .add('b1', attack(b, 'B1'))
                .add('b2', attack(b, 'B2'))      // ← ท่าสุดท้าย: endRotation ต้องไม่ swap ตัดหน้ามัน
                .build();

            expect(() => sim.run(setup, new RotationBuilder().build(), 0)).not.toThrow();
            expect([a.rotationCount, b.rotationCount]).toEqual([1, 1]);
        });

        it('should start each run from the first ally', () => {
            const sim = new Simulate();
            const a = sim.addAlly(new AllyUnit('A'));
            sim.addAlly(new AllyUnit('B'));

            sim.battleField.onFieldChar = sim.battleField.allies[1];   // ค้างจากรอบก่อน

            sim.run(new RotationBuilder().build(), new RotationBuilder().build(), 0);

            expect(sim.battleField.onFieldChar).toBe(a);
        });
    });
});
