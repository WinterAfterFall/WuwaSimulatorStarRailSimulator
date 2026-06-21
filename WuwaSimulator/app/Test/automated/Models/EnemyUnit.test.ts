import { EnemyUnit } from '../../../Models/EnemyUnit';
import { EnemyPosition, UnitStatus } from '../../../Constants/Enum';

describe('EnemyUnit', () => {
    let enemy: EnemyUnit;

    beforeEach(() => {
        enemy = new EnemyUnit('TestBoss');
    });

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────
    describe('constructor', () => {
        it('should set name correctly', () => {
            expect(enemy.name).toBe('TestBoss');
        });

        it('should default status to Alive', () => {
            expect(enemy.isAlive()).toBe(true);
            expect(enemy.status).toBe(UnitStatus.Alive);
        });

        it('should default position to Vanguard', () => {
            expect(enemy.position).toBe(EnemyPosition.Vanguard);
        });

        it('should initialise all tracking maps as empty', () => {
            expect(enemy.debuffStacks.size).toBe(0);
            expect(enemy.debuffNote.size).toBe(0);
            expect(enemy.debuffCheck.size).toBe(0);
            expect(enemy.dmgRecord.size).toBe(0);
            expect(enemy.maxDmgRecord.size).toBe(0);
        });
    });

    // ─────────────────────────────────────────────
    // Position
    // ─────────────────────────────────────────────
    describe('position', () => {
        it('should allow changing position', () => {
            enemy.position = EnemyPosition.Midrange;
            expect(enemy.position).toBe(EnemyPosition.Midrange);
        });

        it('should support all EnemyPosition values', () => {
            for (const pos of Object.values(EnemyPosition)) {
                enemy.position = pos;
                expect(enemy.position).toBe(pos);
            }
        });
    });

    // ─────────────────────────────────────────────
    // Debuff Tracking
    // ─────────────────────────────────────────────
    describe('debuff tracking', () => {
        it('should store and retrieve debuffStacks', () => {
            enemy.debuffStacks.set('Freeze', 3);
            expect(enemy.debuffStacks.get('Freeze')).toBe(3);
        });

        it('should store and retrieve debuffNote', () => {
            enemy.debuffNote.set('Slow', 60);
            expect(enemy.debuffNote.get('Slow')).toBe(60);
        });

        it('should store and retrieve debuffCheck', () => {
            enemy.debuffCheck.set('Poisoned', true);
            expect(enemy.debuffCheck.get('Poisoned')).toBe(true);
        });

        it('should handle multiple debuffs independently', () => {
            enemy.debuffStacks.set('A', 1);
            enemy.debuffStacks.set('B', 2);
            expect(enemy.debuffStacks.get('A')).toBe(1);
            expect(enemy.debuffStacks.get('B')).toBe(2);
        });
    });

    // ─────────────────────────────────────────────
    // Damage Record
    // ─────────────────────────────────────────────
    describe('damage record', () => {
        it('should store damage record', () => {
            enemy.dmgRecord.set('BA', 500);
            expect(enemy.dmgRecord.get('BA')).toBe(500);
        });

        it('should store max damage record', () => {
            enemy.maxDmgRecord.set('Ult', 3000);
            expect(enemy.maxDmgRecord.get('Ult')).toBe(3000);
        });
    });

    // ─────────────────────────────────────────────
    // Inherited Unit stat system
    // ─────────────────────────────────────────────
    describe('inherited stat system', () => {
        it('should allow setting and getting stats', () => {
            const { StatsType } = require('../../../Constants/Enum');
            enemy.setStat(StatsType.FlatDef, 800);
            expect(enemy.getStats(StatsType.FlatDef)).toBe(800);
        });

        it('should allow setting dead', () => {
            enemy.setDead();
            expect(enemy.isAlive()).toBe(false);
        });
    });
});
