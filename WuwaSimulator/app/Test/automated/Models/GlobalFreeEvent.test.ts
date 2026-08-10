import { BattleField } from '../../../Simulator/BattleField';
import { AllyUnit } from '../../../Models/AllyUnit';
import { GlobalFreeEvent } from '../../../Models/Combat/CombatEvent/GlobalFreeEvent';

describe('GlobalFreeEvent', () => {
    let field: BattleField;
    let unit: AllyUnit;

    beforeEach(() => {
        field = new BattleField();
        unit  = new AllyUnit('Mornye');
        field.allies.push(unit);
    });

    it('should release the global lock', () => {
        field.isGlobalLocked = true;

        field.schedule(new GlobalFreeEvent('to-auto', unit));
        field.tick();

        expect(field.isGlobalLocked).toBe(false);
    });

    // ต่างจาก ActionFreeEvent.onField ตรงนี้ — ตัวนั้นปลดทั้งสองอย่าง ตัวนี้ปลดแค่ global
    it('should leave the unit busy', () => {
        unit.setBusy();

        field.schedule(new GlobalFreeEvent('to-auto', unit));
        field.tick();

        expect(unit.isFree()).toBe(false);
    });

    it('should be a no-op when the lock is already open', () => {
        field.schedule(new GlobalFreeEvent('to-auto', unit));
        field.tick();

        expect(field.isGlobalLocked).toBe(false);
    });

    it('should carry the unit it was given', () => {
        expect(new GlobalFreeEvent('to-auto', unit).unit).toBe(unit);
    });

    // รับ time/priority ของ CombatEvent ได้ครบ 3 รูปแบบเหมือน event อื่น
    describe('time and priority', () => {
        it('should default both to 0 when only a unit is given', () => {
            const event = new GlobalFreeEvent('to-auto', unit);

            expect(event.time).toBe(0);
            expect(event.priority).toBe(0);
        });

        it('should take time when given time + unit', () => {
            const event = new GlobalFreeEvent('to-auto', 40, unit);

            expect(event.time).toBe(40);
            expect(event.priority).toBe(0);
            expect(event.unit).toBe(unit);
        });

        it('should take time and priority when given all three', () => {
            const event = new GlobalFreeEvent('to-auto', 40, 3, unit);

            expect(event.time).toBe(40);
            expect(event.priority).toBe(3);
            expect(event.unit).toBe(unit);
        });
    });
});
