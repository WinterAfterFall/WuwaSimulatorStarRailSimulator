import { increaseEnergy } from '../../../Services/Combat/EnergyService';
import { TriggerBus } from '../../../Simulator/TriggerBus';
import { AllyUnit } from '../../../Models/AllyUnit';
import { TriggerEvent, ActionType } from '../../../Constants/Enum';

describe('increaseEnergy', () => {
    let bus: TriggerBus;
    let unit: AllyUnit;

    beforeEach(() => {
        bus  = new TriggerBus();
        unit = new AllyUnit('Attacker');
        unit.maxEnergy = 100;
        unit.energy    = 0;
    });

    it('should add the amount to unit.energy', () => {
        increaseEnergy(unit, 30, bus);
        expect(unit.energy).toBe(30);
    });

    it('should clamp energy at maxEnergy', () => {
        unit.energy = 90;
        increaseEnergy(unit, 30, bus);
        expect(unit.energy).toBe(100);
    });

    it('should emit TriggerEvent.EnergyIncrease with the unit and amount', () => {
        const listener = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, listener);

        increaseEnergy(unit, 40, bus, ActionType.Ult);

        expect(listener).toHaveBeenCalledWith({ unit, amount: 40, actionType: ActionType.Ult });
    });

    it('should emit the event before clamping — listener sees the pre-clamp (possibly overflowing) amount', () => {
        unit.energy = 90;
        let seenAmount = -1;
        bus.on(TriggerEvent.EnergyIncrease, (ctx) => { seenAmount = ctx.amount; });

        increaseEnergy(unit, 30, bus);

        // listener เห็นค่าดิบ 30 (ซึ่งจะทำให้ 90+30=120 เกิน max) ก่อนโดน clamp เหลือ 100
        expect(seenAmount).toBe(30);
        expect(unit.energy).toBe(100);
    });

    // ─────────────────────────────────────────────
    // จำลอง passive สไตล์ "Saber A4" ของ StarRailSimulator:
    // ตรวจ overflow จาก context ก่อน mutate แล้วแปลง energy ที่ล้นเป็นบัฟอื่นแทน
    // ─────────────────────────────────────────────
    it('should let a registered passive detect energy overflow via the pre-clamp context', () => {
        unit.energy = 90;
        let overflowStack = 0;

        bus.on(TriggerEvent.EnergyIncrease, (ctx) => {
            const wouldBe = ctx.unit.energy + ctx.amount;
            if (wouldBe > ctx.unit.maxEnergy) {
                overflowStack += wouldBe - ctx.unit.maxEnergy;
            }
        });

        increaseEnergy(unit, 30, bus);

        expect(overflowStack).toBe(20); // 90 + 30 - 100
        expect(unit.energy).toBe(100);
    });

    it('should notify multiple registered listeners on a single gain (e.g. another ally reacting)', () => {
        const ownPassive  = jest.fn();
        const allyPassive = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, ownPassive);
        bus.on(TriggerEvent.EnergyIncrease, allyPassive);

        increaseEnergy(unit, 10, bus);

        expect(ownPassive).toHaveBeenCalledTimes(1);
        expect(allyPassive).toHaveBeenCalledTimes(1);
    });
});
