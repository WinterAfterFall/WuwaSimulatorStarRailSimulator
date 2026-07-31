import { calculateDamage } from '../../../Services/Damage/DamageCalculate';
import { Damage } from '../../../Models/Combat/Damage';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { TriggerBus } from '../../../Simulator/TriggerBus';
import { ActionType, ElementType, TriggerEvent } from '../../../Constants/Enum';

describe('calculateDamage — energy gain wiring', () => {
    let attacker: AllyUnit;
    let enemy: EnemyUnit;
    let bus: TriggerBus;

    beforeEach(() => {
        attacker = new AllyUnit('Attacker');
        attacker.elementType = ElementType.Spectro;
        attacker.maxEnergy   = 100;
        attacker.energy      = 0;

        enemy = new EnemyUnit('Boss');
        bus   = new TriggerBus();
    });

    it('should add energyGain to attacker.energy through increaseEnergy', () => {
        const damage = new Damage(attacker, 'Skill', ActionType.Skill, enemy, 20);
        calculateDamage(damage, bus);

        expect(attacker.energy).toBe(20);
    });

    it('should emit TriggerEvent.EnergyIncrease so other passives can react', () => {
        const listener = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, listener);

        const damage = new Damage(attacker, 'Ult', ActionType.Ult, enemy, 15);
        calculateDamage(damage, bus);

        expect(listener).toHaveBeenCalledWith({ unit: attacker, amount: 15, actionType: ActionType.Ult });
    });

    it('should not touch energy or emit the event when energyGain is omitted', () => {
        const listener = jest.fn();
        bus.on(TriggerEvent.EnergyIncrease, listener);

        const damage = new Damage(attacker, 'BA', ActionType.BA, enemy);
        calculateDamage(damage, bus);

        expect(attacker.energy).toBe(0);
        expect(listener).not.toHaveBeenCalled();
    });
});
