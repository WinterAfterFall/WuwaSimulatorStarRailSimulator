import { Damage } from '../../../Models/Combat/Damage';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { ActionType, ElementType, EnemyPosition, MultiplierType, SkillRange } from '../../../Constants/Enum';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeAttacker(element = ElementType.Spectro): AllyUnit {
    const unit = new AllyUnit('Attacker');
    unit.elementType = element;
    return unit;
}

function makeEnemy(name: string, position: EnemyPosition): EnemyUnit {
    const e = new EnemyUnit(name);
    e.position = position;
    return e;
}

describe('Damage', () => {
    let attacker: AllyUnit;
    let enemy: EnemyUnit;

    beforeEach(() => {
        attacker = makeAttacker();
        enemy    = makeEnemy('Boss', EnemyPosition.Vanguard);
    });

    // ─────────────────────────────────────────────
    // Constructor — single target
    // ─────────────────────────────────────────────
    describe('constructor: single EnemyUnit target', () => {
        it('should set name', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.name).toBe('BA');
        });

        it('should set attacker', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.attacker).toBe(attacker);
        });

        it('should derive element from attacker', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.element).toBe(ElementType.Spectro);
        });

        it('should wrap single ActionType into array', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.attackTypeList).toEqual([ActionType.BA]);
        });

        it('should accept ActionType array directly', () => {
            const d = new Damage(attacker, 'Skill', [ActionType.Skill, ActionType.BA], enemy);
            expect(d.attackTypeList).toEqual([ActionType.Skill, ActionType.BA]);
        });

        it('should set single target into targets array', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.targets).toEqual([enemy]);
        });

        it('should default isCritable to true', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.isCritable).toBe(true);
        });

        it('should default energyGain to undefined when omitted', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.energyGain).toBeUndefined();
        });

        it('should set energyGain when provided', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy, 10);
            expect(d.energyGain).toBe(10);
        });

        it('should set both energyGain and concentoEnergyGain', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy, 10, 5);
            expect(d.energyGain).toBe(10);
            expect(d.concentoEnergyGain).toBe(5);
        });

        it('should default concentoEnergyGain to undefined when omitted', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy, 10);
            expect(d.concentoEnergyGain).toBeUndefined();
        });
    });

    // ─────────────────────────────────────────────
    // Constructor — EnemyUnit[] target
    // ─────────────────────────────────────────────
    describe('constructor: EnemyUnit[] targets', () => {
        it('should set multiple targets', () => {
            const e2 = makeEnemy('Boss2', EnemyPosition.Midrange);
            const d  = new Damage(attacker, 'Ult', ActionType.Ult, [enemy, e2]);
            expect(d.targets).toEqual([enemy, e2]);
        });

        it('should set energyGain correctly', () => {
            const d = new Damage(attacker, 'Ult', ActionType.Ult, [enemy], 20, 10);
            expect(d.energyGain).toBe(20);
            expect(d.concentoEnergyGain).toBe(10);
        });
    });

    // ─────────────────────────────────────────────
    // Constructor — SkillRange
    // ─────────────────────────────────────────────
    describe('constructor: SkillRange', () => {
        let van: EnemyUnit;
        let mid: EnemyUnit;
        let rear: EnemyUnit;
        let out: EnemyUnit;
        let allEnemies: EnemyUnit[];

        beforeEach(() => {
            van  = makeEnemy('Van',  EnemyPosition.Vanguard);   // "0"
            mid  = makeEnemy('Mid',  EnemyPosition.Midrange);   // "1"
            rear = makeEnemy('Rear', EnemyPosition.Rearguard);  // "2"
            out  = makeEnemy('Out',  EnemyPosition.OutOfRange); // "3"
            allEnemies = [van, mid, rear, out];
        });

        it('Contact (1) should hit only Vanguard', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, SkillRange.Contact, allEnemies);
            expect(d.targets).toEqual([van]);
        });

        it('Midrange (2) should hit Vanguard and Midrange', () => {
            const d = new Damage(attacker, 'Skill', ActionType.Skill, SkillRange.Midrange, allEnemies);
            expect(d.targets).toEqual([van, mid]);
        });

        it('Ranged (3) should hit Vanguard, Midrange, and Rearguard', () => {
            const d = new Damage(attacker, 'Ult', ActionType.Ult, SkillRange.Ranged, allEnemies);
            expect(d.targets).toEqual([van, mid, rear]);
        });

        it('Global (999) should hit all positions including OutOfRange', () => {
            const d = new Damage(attacker, 'Echo', ActionType.Echo, SkillRange.Global, allEnemies);
            expect(d.targets).toEqual([van, mid, rear, out]);
        });

        it('None (0) should hit no enemies', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, SkillRange.None, allEnemies);
            expect(d.targets).toEqual([]);
        });

        it('should set energyGain when provided', () => {
            const d = new Damage(attacker, 'Ult', ActionType.Ult, SkillRange.Global, allEnemies, 25, 12);
            expect(d.energyGain).toBe(25);
            expect(d.concentoEnergyGain).toBe(12);
        });
    });

    // ─────────────────────────────────────────────
    // setMultipliers
    // ─────────────────────────────────────────────
    describe('setMultipliers', () => {
        it('should set all 4 values at once', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(1.5, 0.2, 0.1, 100);
            expect(d.multipliers[MultiplierType.Atk]).toBe(1.5);
            expect(d.multipliers[MultiplierType.Hp]).toBe(0.2);
            expect(d.multipliers[MultiplierType.Def]).toBe(0.1);
            expect(d.multipliers[MultiplierType.Const]).toBe(100);
        });

        it('should set specific fields via pairs', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers([MultiplierType.Atk, 2.0], [MultiplierType.Const, 500]);
            expect(d.multipliers[MultiplierType.Atk]).toBe(2.0);
            expect(d.multipliers[MultiplierType.Const]).toBe(500);
            expect(d.multipliers[MultiplierType.Hp]).toBe(0);
        });

        it('should overwrite previous values', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(1.0, 0, 0, 0);
            d.setMultipliers(2.0, 0, 0, 0);
            expect(d.multipliers[MultiplierType.Atk]).toBe(2.0);
        });

        it('should return this for chaining', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.setMultipliers(1, 0, 0, 0)).toBe(d);
        });
    });

    // ─────────────────────────────────────────────
    // addMultipliers
    // ─────────────────────────────────────────────
    describe('addMultipliers', () => {
        it('should add to all 4 fields', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(1.0, 0.1, 0.1, 100);
            d.addMultipliers(0.5, 0.1, 0, 50);
            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(1.5);
            expect(d.multipliers[MultiplierType.Hp]).toBeCloseTo(0.2);
            expect(d.multipliers[MultiplierType.Const]).toBe(150);
        });

        it('should add to specific fields via pairs', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(1.0, 0, 0, 0);
            d.addMultipliers([MultiplierType.Atk, 0.5]);
            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(1.5);
            expect(d.multipliers[MultiplierType.Hp]).toBe(0);
        });

        it('should return this for chaining', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.addMultipliers(0, 0, 0, 0)).toBe(d);
        });
    });

    // ─────────────────────────────────────────────
    // multiplyMultipliers
    // ─────────────────────────────────────────────
    describe('multiplyMultipliers', () => {
        it('scalar — should multiply all fields by same value', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(2.0, 1.0, 0.5, 100);
            d.multiplyMultipliers(2);
            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(4.0);
            expect(d.multipliers[MultiplierType.Hp]).toBeCloseTo(2.0);
            expect(d.multipliers[MultiplierType.Def]).toBeCloseTo(1.0);
            expect(d.multipliers[MultiplierType.Const]).toBe(200);
        });

        it('4 values — should multiply each field independently', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(2.0, 1.0, 0.5, 100);
            d.multiplyMultipliers(2, 3, 4, 0.5);
            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(4.0);
            expect(d.multipliers[MultiplierType.Hp]).toBeCloseTo(3.0);
            expect(d.multipliers[MultiplierType.Def]).toBeCloseTo(2.0);
            expect(d.multipliers[MultiplierType.Const]).toBe(50);
        });

        it('pairs — should multiply only specified fields', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.setMultipliers(2.0, 1.0, 0.5, 100);
            d.multiplyMultipliers([MultiplierType.Atk, 3]);
            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(6.0);
            expect(d.multipliers[MultiplierType.Hp]).toBeCloseTo(1.0);
        });

        it('should return this for chaining', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.multiplyMultipliers(1)).toBe(d);
        });
    });

    // ─────────────────────────────────────────────
    // addGauges
    // ─────────────────────────────────────────────
    describe('addGauges', () => {
        it('should add a single gauge pair', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.addGauges(['Stagger', 100]);
            expect(d.gauges).toEqual([['Stagger', 100]]);
        });

        it('should add multiple gauge pairs at once', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.addGauges(['Stagger', 100], ['Freeze', 50], ['Outro', 30]);
            expect(d.gauges).toEqual([['Stagger', 100], ['Freeze', 50], ['Outro', 30]]);
        });

        it('should accumulate across multiple calls', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            d.addGauges(['Stagger', 100]);
            d.addGauges(['Freeze', 50]);
            expect(d.gauges.length).toBe(2);
        });

        it('should return this for chaining', () => {
            const d = new Damage(attacker, 'BA', ActionType.BA, enemy);
            expect(d.addGauges(['Stagger', 100])).toBe(d);
        });
    });

    // ─────────────────────────────────────────────
    // Method chaining
    // ─────────────────────────────────────────────
    describe('method chaining', () => {
        it('should support full chain', () => {
            const d = new Damage(attacker, 'Skill', ActionType.Skill, enemy, 20, 10)
                .setMultipliers(1.5, 0, 0, 0)
                .addMultipliers([MultiplierType.Const, 100])
                .multiplyMultipliers(1.1)
                .addGauges(['Stagger', 80], ['Freeze', 40]);

            expect(d.multipliers[MultiplierType.Atk]).toBeCloseTo(1.65);
            expect(d.multipliers[MultiplierType.Const]).toBeCloseTo(110);
            expect(d.gauges.length).toBe(2);
            expect(d.energyGain).toBe(20);
        });
    });
});
