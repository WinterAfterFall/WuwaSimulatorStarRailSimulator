import { calculateDamage } from '../../../Services/Damage/DamageCalculate';
import { Damage } from '../../../Models/Combat/Damage';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { ActionType, ElementType } from '../../../Constants/Enum';

// การจ่าย energy/concento/gauge ย้ายไปอยู่ที่ CombatTimeline.applyResourceGain แล้ว
// (test ชุดนั้นอยู่ใน Simulator/CombatTimeline.test.ts) — ที่นี่เหลือแค่เรื่องสูตรล้วนๆ
describe('calculateDamage — pure formula, no side effects on the attacker', () => {
    let attacker: AllyUnit;
    let enemy   : EnemyUnit;

    beforeEach(() => {
        attacker = new AllyUnit('Attacker');
        attacker.elementType = ElementType.Spectro;
        attacker.maxEnergy   = 100;
        attacker.energy      = 0;

        enemy = new EnemyUnit('Boss');
    });

    it('should not grant energy even when the damage carries energyGain', () => {
        calculateDamage(new Damage(attacker, 'Skill', ActionType.Skill, enemy, 20));

        expect(attacker.energy).toBe(0);
    });

    it('should not grant concento energy even when the damage carries it', () => {
        attacker.concentoEnergy = 5;

        calculateDamage(new Damage(attacker, 'Skill', ActionType.Skill, enemy, undefined, 3));

        expect(attacker.concentoEnergy).toBe(5);
    });

    it('should not touch gauges', () => {
        calculateDamage(
            new Damage(attacker, 'BA', ActionType.BA, enemy).addGauges(['Spectro', 4])
        );

        expect(attacker.gauges.size).toBe(0);
    });
});
