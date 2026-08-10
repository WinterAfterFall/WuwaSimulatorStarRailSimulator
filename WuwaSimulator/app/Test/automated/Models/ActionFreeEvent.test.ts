import { BattleField } from '../../../Simulator/BattleField';
import { AllyUnit } from '../../../Models/AllyUnit';
import { ActionFreeEvent } from '../../../Models/Combat/CombatEvent/ActionFreeEvent';
import { ActionState } from '../../../Constants/Enum';

describe('ActionFreeEvent', () => {
    let field: BattleField;
    let unit: AllyUnit;

    beforeEach(() => {
        field = new BattleField();
        unit  = new AllyUnit('Mornye');
        field.allies.push(unit);
    });

    describe('naming', () => {
        it('should use the name exactly as given on the off-field variant', () => {
            expect(ActionFreeEvent.offField('Mornye-free-f120', unit).name).toBe('Mornye-free-f120');
        });

        it('should use the name exactly as given on the on-field variant', () => {
            expect(ActionFreeEvent.onField('Mornye-free-f120', unit).name).toBe('Mornye-free-f120');
        });

        // ชื่อคือ key ของ IPQ — คนเรียกตั้งชื่อเองได้จึงปลดหลายตัวพร้อมกันได้
        it('should let several free events sit in the queue together', () => {
            const other = new AllyUnit('Other');
            field.allies.push(other);

            field.schedule(ActionFreeEvent.onField('free-mornye', unit));
            field.schedule(ActionFreeEvent.offField('free-other', other), 30);

            expect(field.size).toBe(2);
        });
    });

    describe('unit', () => {
        it('should carry the unit it was given', () => {
            expect(ActionFreeEvent.offField('free-a', unit).unit).toBe(unit);
            expect(ActionFreeEvent.onField('free-a', unit).unit).toBe(unit);
        });
    });

    describe('execute', () => {
        it('should set a busy unit free', () => {
            unit.setBusy();

            field.schedule(ActionFreeEvent.onField('free-a', unit));
            field.tick();

            expect(unit.actionState).toBe(ActionState.Free);
            expect(unit.isFree()).toBe(true);
        });

        it('should free the unit on the off-field variant too', () => {
            unit.setBusy();

            field.schedule(ActionFreeEvent.offField('free-a', unit));
            field.tick();

            expect(unit.isFree()).toBe(true);
        });

        it('should free only the unit it was given', () => {
            const other = new AllyUnit('Other');
            field.allies.push(other);
            unit.setBusy();
            other.setBusy();

            field.schedule(ActionFreeEvent.onField('free-a', unit));
            field.tick();

            expect(unit.isFree()).toBe(true);
            expect(other.isFree()).toBe(false);
        });

        it('should leave an already free unit alone', () => {
            field.schedule(ActionFreeEvent.onField('free-a', unit));
            field.tick();

            expect(unit.isFree()).toBe(true);
        });
    });

    // รับ time/priority ของ CombatEvent ได้ครบ 3 รูปแบบเหมือน event อื่น
    describe('time and priority', () => {
        it('should default both to 0 when only a unit is given', () => {
            const event = ActionFreeEvent.onField('free-a', unit);

            expect(event.time).toBe(0);
            expect(event.priority).toBe(0);
        });

        it('should take time when given time + unit', () => {
            const event = ActionFreeEvent.onField('free-a', 120, unit);

            expect(event.time).toBe(120);
            expect(event.priority).toBe(0);
            expect(event.unit).toBe(unit);
        });

        it('should take time and priority when given all three', () => {
            const event = ActionFreeEvent.onField('free-a', 120, -5, unit);

            expect(event.time).toBe(120);
            expect(event.priority).toBe(-5);
            expect(event.unit).toBe(unit);
        });

        it('should support the same forms on the off-field variant', () => {
            const event = ActionFreeEvent.offField('free-a', 60, 2, unit);

            expect(event.name).toBe('free-a');
            expect(event.time).toBe(60);
            expect(event.priority).toBe(2);
        });

        // priority เป็น tie-breaker จริงตอนอยู่ใน IPQ ไม่ใช่แค่ค่าที่เก็บไว้เฉยๆ
        it('should let priority decide the order within the same frame', () => {
            const order: string[] = [];
            const other = new AllyUnit('Other');
            field.allies.push(other);

            const late  = ActionFreeEvent.onField('free-late', 0, 5, unit);
            const early = ActionFreeEvent.offField('free-early', 0, -5, other);
            late.execute  = () => order.push('late');
            early.execute = () => order.push('early');

            field.schedule(late);
            field.schedule(early);
            field.runAll();

            expect(order).toEqual(['early', 'late']);
        });
    });

    // ตัวที่ยืนบนสนามเป็นคนถือ GlobalLock ไว้ พอท่าจบต้องคืนสิทธิ์ให้ Director
    // ส่วนตัวนอกสนามไม่เคยล็อกอะไรไว้ จึงต้องไม่ไปแตะของคนอื่น
    describe('global lock', () => {
        it('should release the global lock on the on-field variant', () => {
            field.isGlobalLocked = true;

            field.schedule(ActionFreeEvent.onField('free-a', unit));
            field.tick();

            expect(field.isGlobalLocked).toBe(false);
        });

        it('should leave the global lock alone on the off-field variant', () => {
            field.isGlobalLocked = true;

            field.schedule(ActionFreeEvent.offField('free-a', unit));
            field.tick();

            expect(field.isGlobalLocked).toBe(true);
        });

        it('should still free the unit while releasing the lock', () => {
            unit.setBusy();
            field.isGlobalLocked = true;

            field.schedule(ActionFreeEvent.onField('free-a', unit));
            field.tick();

            expect(unit.isFree()).toBe(true);
            expect(field.isGlobalLocked).toBe(false);
        });
    });
});
