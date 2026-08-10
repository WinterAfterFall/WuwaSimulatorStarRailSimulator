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
    });

    // เทสระดับ Director — เคสที่ unit test ข้างบนจับไม่ได้ เพราะ battleField.rotationCount
    // ขยับจากฝั่ง Director สวนทางกับจังหวะที่ swap event รัน
    describe('driven by RotationDirector', () => {
        it('should rotate through the whole team once per round', () => {
            const sim = new Simulate();
            sim.addAlly(new AllyUnit('A'));
            sim.addAlly(new AllyUnit('B'));
            sim.addAlly(new AllyUnit('C'));

            const field = sim.battleField;
            const seen: string[] = [];

            const swapAction = (name: string) =>
                [name, () => field.schedule(new SwapCharacterEvent())] as const;

            const loop = new RotationBuilder();
            for (const [name, fn] of [swapAction('a1'), swapAction('a2'), swapAction('a3')]) {
                loop.add(name, () => { if (name !== 'a3') fn(); });   // N-1 = 2 ครั้ง
            }

            const originalTick = field.tick.bind(field);
            field.tick = () => {
                const event = originalTick();
                if (event?.name.includes('Swap')) seen.push(field.onFieldChar!.name);
                return event;
            };

            sim.run(new RotationBuilder().build(), loop.build(), 2);

            expect(seen).toEqual(['B', 'C', 'A', 'B', 'C', 'A']);
        });

        it('should leave every ally on the same rotationCount after a full round', () => {
            const sim = new Simulate();
            const a = sim.addAlly(new AllyUnit('A'));
            const b = sim.addAlly(new AllyUnit('B'));
            const c = sim.addAlly(new AllyUnit('C'));

            const field = sim.battleField;
            const swap  = () => field.schedule(new SwapCharacterEvent());

            sim.run(
                new RotationBuilder().build(),
                new RotationBuilder()
                    .add('a1', swap).add('a2', swap).add('a3', () => {})
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

            const attack = (unit: AllyUnit, name: string) => () =>
                field.scheduleStartOnFieldAction(
                    new AttackActionEvent(`${name}-f${field.currentFrame}`, unit, ActionType.BA),
                    30,
                );

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
