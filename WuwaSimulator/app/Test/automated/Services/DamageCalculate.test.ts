import { calculateDamage } from '../../../Services/Damage/DamageCalculate';
import { Damage } from '../../../Models/Combat/Damage';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { ActionType, ElementType } from '../../../Constants/Enum';

// การจ่าย energy/concento/gauge ย้ายไปอยู่ที่ BattleField.applyResourceGain แล้ว
// (test ชุดนั้นอยู่ใน Simulator/BattleField.test.ts) — ที่นี่เหลือแค่เรื่องสูตรล้วนๆ
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

describe('calculateDamage — records into dmgRecord/totalDamageRecord for both attacker and target', () => {
    let attacker: AllyUnit;
    let enemy   : EnemyUnit;

    beforeEach(() => {
        attacker = new AllyUnit('Attacker');
        attacker.elementType = ElementType.Spectro;
        attacker.baseAtk = 1000;
        attacker.allyNum = 1;

        enemy = new EnemyUnit('Boss');
    });

    it('records the same hit value into both attacker and target dmgRecord under the damage name', () => {
        const damage = new Damage(attacker, 'Skill', ActionType.Skill, enemy).setMultipliers(1, 0, 0, 0);

        calculateDamage(damage);

        const recorded = attacker.dmgRecord.get('Skill');
        expect(recorded).toBeGreaterThan(0);
        expect(enemy.dmgRecord.get('Skill')).toBe(recorded);
    });

    it('accumulates dmgRecord across repeated hits with the same name', () => {
        const damage = new Damage(attacker, 'Skill', ActionType.Skill, enemy).setMultipliers(1, 0, 0, 0);

        calculateDamage(damage);
        const single = attacker.dmgRecord.get('Skill')!;
        calculateDamage(damage);

        expect(attacker.dmgRecord.get('Skill')).toBeCloseTo(single * 2);
        expect(enemy.dmgRecord.get('Skill')).toBeCloseTo(single * 2);
    });

    it('sums every hit into attacker.totalDamageRecord regardless of damage name', () => {
        const ba  = new Damage(attacker, 'BA', ActionType.BA, enemy).setMultipliers(1, 0, 0, 0);
        const ult = new Damage(attacker, 'Ult', ActionType.Ult, enemy).setMultipliers(2, 0, 0, 0);

        calculateDamage(ba);
        calculateDamage(ult);

        const expectedTotal = attacker.dmgRecord.get('BA')! + attacker.dmgRecord.get('Ult')!;
        expect(attacker.totalDamageRecord).toBeCloseTo(expectedTotal);
    });

    it("accumulates target.totalDamageRecord at the attacker's allyNum index", () => {
        const damage = new Damage(attacker, 'BA', ActionType.BA, enemy).setMultipliers(1, 0, 0, 0);

        calculateDamage(damage);
        calculateDamage(damage);

        expect(enemy.totalDamageRecord[attacker.allyNum]).toBeCloseTo(attacker.totalDamageRecord);
    });

    it("leaves other allyNum slots on the target's totalDamageRecord untouched", () => {
        enemy.totalDamageRecord[0] = 999; // ดาเมจที่ ally คนละคน (allyNum 0) เคยตีไว้ก่อนหน้า

        const damage = new Damage(attacker, 'BA', ActionType.BA, enemy).setMultipliers(1, 0, 0, 0);
        calculateDamage(damage);

        expect(enemy.totalDamageRecord[0]).toBe(999);
        expect(enemy.totalDamageRecord[attacker.allyNum]).toBeGreaterThan(0);
    });

    it('does not touch maxDmgRecord — that is only updated by AllyUnit.updateMaxRecords() at round end', () => {
        const damage = new Damage(attacker, 'BA', ActionType.BA, enemy).setMultipliers(1, 0, 0, 0);

        calculateDamage(damage);

        expect(attacker.maxDmgRecord.size).toBe(0);
        expect(enemy.maxDmgRecord.size).toBe(0);
    });
});
