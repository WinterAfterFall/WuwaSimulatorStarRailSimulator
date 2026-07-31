import { TriggerBus, EnergyIncreaseContext } from '../../../Simulator/TriggerBus';
import { AllyUnit } from '../../../Models/AllyUnit';
import { TriggerEvent, ActionType } from '../../../Constants/Enum';

describe('TriggerBus', () => {
    let bus: TriggerBus;
    let unit: AllyUnit;

    beforeEach(() => {
        bus  = new TriggerBus();
        unit = new AllyUnit('Listener');
    });

    it('should call a registered listener when the event is emitted', () => {
        const callback = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, callback);

        const ctx: EnergyIncreaseContext = { unit, amount: 10 };
        bus.emit(TriggerEvent.EnergyIncrease, ctx);

        expect(callback).toHaveBeenCalledWith(ctx);
    });

    it('should not throw when emitting an event with no listeners', () => {
        expect(() => bus.emit(TriggerEvent.EnergyIncrease, { unit, amount: 5 })).not.toThrow();
    });

    it('should call every listener registered for the same event', () => {
        const first  = jest.fn();
        const second = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, first);
        bus.on(TriggerEvent.EnergyIncrease, second);

        bus.emit(TriggerEvent.EnergyIncrease, { unit, amount: 1 });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('should run higher-priority listeners before lower-priority ones', () => {
        const order: string[] = [];
        bus.on(TriggerEvent.EnergyIncrease, () => order.push('low'), 0);
        bus.on(TriggerEvent.EnergyIncrease, () => order.push('high'), 100);

        bus.emit(TriggerEvent.EnergyIncrease, { unit, amount: 1 });

        expect(order).toEqual(['high', 'low']);
    });

    it('should preserve registration order among equal priorities (stable sort)', () => {
        const order: string[] = [];
        bus.on(TriggerEvent.EnergyIncrease, () => order.push('a'), 5);
        bus.on(TriggerEvent.EnergyIncrease, () => order.push('b'), 5);
        bus.on(TriggerEvent.EnergyIncrease, () => order.push('c'), 5);

        bus.emit(TriggerEvent.EnergyIncrease, { unit, amount: 1 });

        expect(order).toEqual(['a', 'b', 'c']);
    });

    it('should pass the full context (unit, amount, actionType) to listeners', () => {
        let received: EnergyIncreaseContext | undefined;
        bus.on(TriggerEvent.EnergyIncrease, (ctx) => { received = ctx; });

        bus.emit(TriggerEvent.EnergyIncrease, { unit, amount: 25, actionType: ActionType.Skill });

        expect(received?.unit).toBe(unit);
        expect(received?.amount).toBe(25);
        expect(received?.actionType).toBe(ActionType.Skill);
    });
});
