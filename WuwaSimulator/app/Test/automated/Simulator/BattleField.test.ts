import { BattleField } from '../../../Simulator/BattleField';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { EnemyPosition, SkillRange, StatsType } from '../../../Constants/Enum';

function makeEnemy(name: string, position: EnemyPosition): EnemyUnit {
    const e = new EnemyUnit(name);
    e.position = position;
    return e;
}

describe('BattleField', () => {
    let field: BattleField;

    beforeEach(() => {
        field = new BattleField();
    });

    // ─────────────────────────────────────────────
    // สร้างใหม่ต้องว่างเปล่าเสมอ
    // ─────────────────────────────────────────────
    describe('initial state', () => {
        it('should start with empty allies', () => {
            expect(field.allies).toEqual([]);
        });

        it('should start with empty enemies', () => {
            expect(field.enemies).toEqual([]);
        });
    });

    // ─────────────────────────────────────────────
    // createEnemy
    // ─────────────────────────────────────────────
    describe('createEnemy', () => {
        it('should return an EnemyUnit with the given name', () => {
            const enemy = field.createEnemy('Boss');
            expect(enemy).toBeInstanceOf(EnemyUnit);
            expect(enemy.name).toBe('Boss');
        });

        it('should push the created enemy into enemies', () => {
            const enemy = field.createEnemy('Boss');
            expect(field.enemies).toEqual([enemy]);
        });

        it('should accumulate multiple enemies in creation order', () => {
            const a = field.createEnemy('A');
            const b = field.createEnemy('B');
            expect(field.enemies).toEqual([a, b]);
        });
    });

    // ─────────────────────────────────────────────
    // enemiesInRange — logic เดิมที่ย้ายมาจาก Damage.ts
    // ─────────────────────────────────────────────
    describe('enemiesInRange', () => {
        let van: EnemyUnit;
        let mid: EnemyUnit;
        let rear: EnemyUnit;
        let out: EnemyUnit;

        beforeEach(() => {
            van  = makeEnemy('Van',  EnemyPosition.Vanguard);   // "0"
            mid  = makeEnemy('Mid',  EnemyPosition.Midrange);   // "1"
            rear = makeEnemy('Rear', EnemyPosition.Rearguard);  // "2"
            out  = makeEnemy('Out',  EnemyPosition.OutOfRange); // "3"
            field.enemies = [van, mid, rear, out];
        });

        it('Contact (1) should hit only Vanguard', () => {
            expect(field.enemiesInRange(SkillRange.Contact)).toEqual([van]);
        });

        it('Midrange (2) should hit Vanguard and Midrange', () => {
            expect(field.enemiesInRange(SkillRange.Midrange)).toEqual([van, mid]);
        });

        it('Ranged (3) should hit Vanguard, Midrange, and Rearguard', () => {
            expect(field.enemiesInRange(SkillRange.Ranged)).toEqual([van, mid, rear]);
        });

        it('Global (999) should hit all positions including OutOfRange', () => {
            expect(field.enemiesInRange(SkillRange.Global)).toEqual([van, mid, rear, out]);
        });

        it('None (0) should hit no enemies', () => {
            expect(field.enemiesInRange(SkillRange.None)).toEqual([]);
        });

        it('should not mutate enemies', () => {
            field.enemiesInRange(SkillRange.Contact);
            expect(field.enemies).toEqual([van, mid, rear, out]);
        });
    });

    // ─────────────────────────────────────────────
    // resetAllUnits
    // ─────────────────────────────────────────────
    describe('resetAllUnits', () => {
        it('should reset ally stats back to their default values', () => {
            const ally = new AllyUnit('Ally');
            ally.setDefaultStat(StatsType.AtkP, 10);
            ally.setStat(StatsType.AtkP, 50);
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.getStats(StatsType.AtkP)).toBe(10);
        });

        it('should reset enemy stats back to their default values', () => {
            const enemy = field.createEnemy('Boss');
            enemy.setStat(StatsType.Res, 99);

            field.resetAllUnits();

            // EnemyUnit constructor ตั้ง defaultStats ของ Res ไว้ที่ 10
            expect(enemy.getStats(StatsType.Res)).toBe(10);
        });

        it('should zero out stats that have no default value', () => {
            // Sp ไม่มีใน defaultStats ของ AllyUnit (ต่างจาก CR/CD ที่ constructor ตั้งไว้ 5/150)
            const ally = new AllyUnit('Ally');
            ally.setStat(StatsType.Sp, 40);
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.getStats(StatsType.Sp)).toBe(0);
        });

        it('should keep AllyUnit built-in defaults (CR 5 / CD 150) after reset', () => {
            const ally = new AllyUnit('Ally');
            ally.setStat(StatsType.CR, 80);
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.getStats(StatsType.CR)).toBe(5);
            expect(ally.getStats(StatsType.CD)).toBe(150);
        });
    });

    // ─────────────────────────────────────────────
    // Isolation — หัวใจของ refactor นี้
    // พิสูจน์ว่าบั๊ก state รั่วข้าม simulation ตายแล้วจริง
    // ─────────────────────────────────────────────
    describe('isolation between instances', () => {
        it('should not share enemies between two BattleFields', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            const bossA = fieldA.createEnemy('BossA');
            const bossB = fieldB.createEnemy('BossB');

            expect(fieldA.enemies).toEqual([bossA]);
            expect(fieldB.enemies).toEqual([bossB]);
        });

        it('should not share allies between two BattleFields', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            fieldA.allies.push(new AllyUnit('AllyA'));

            expect(fieldA.allies.length).toBe(1);
            expect(fieldB.allies.length).toBe(0);
        });

        it('enemiesInRange should only see its own enemies', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            const vanA = makeEnemy('VanA', EnemyPosition.Vanguard);
            const vanB = makeEnemy('VanB', EnemyPosition.Vanguard);
            fieldA.enemies = [vanA];
            fieldB.enemies = [vanB];

            expect(fieldA.enemiesInRange(SkillRange.Global)).toEqual([vanA]);
            expect(fieldB.enemiesInRange(SkillRange.Global)).toEqual([vanB]);
        });
    });
});
