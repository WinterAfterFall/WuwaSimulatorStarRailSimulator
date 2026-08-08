import { BattleField } from '../../../Simulator/BattleField';
import { TriggerBus } from '../../../Simulator/TriggerBus';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { Damage } from '../../../Models/Combat/Damage';
import { CombatEvent } from '../../../Models/Combat/CombatEvent/CombatEvent';
import { DamageEvent } from '../../../Models/Combat/CombatEvent/DamageEvent';
import { GlobalLockChange } from '../../../Models/Combat/CombatEvent/GlobalLockChange';
import { EnemyPosition, SkillRange, StatsType, ActionType, ElementType, TriggerEvent } from '../../../Constants/Enum';

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

        it('should not share a TriggerBus between two BattleFields', () => {
            const fieldA = new BattleField();
            const fieldB = new BattleField();

            expect(fieldA.triggerBus).toBeInstanceOf(TriggerBus);
            expect(fieldA.triggerBus).not.toBe(fieldB.triggerBus);
        });
    });

    // ─────────────────────────────────────────────
    // ทรัพยากรที่ผู้ตีได้จากท่า — ย้ายออกมาจาก calculateDamage
    // เพราะเป็นคนละเรื่องกับสูตรดาเมจ และตรงนี้มี triggerBus อยู่แล้ว
    // ─────────────────────────────────────────────
    describe('applyResourceGain', () => {
        let attacker: AllyUnit;
        let enemy   : EnemyUnit;

        beforeEach(() => {
            attacker = new AllyUnit('Attacker');
            attacker.elementType = ElementType.Spectro;
            attacker.maxEnergy   = 100;
            attacker.energy      = 0;

            enemy = new EnemyUnit('Boss');
        });

        it('should add energyGain to the attacker', () => {
            field.applyResourceGain(new Damage(attacker, 'Skill', ActionType.Skill, enemy, 20));

            expect(attacker.energy).toBe(20);
        });

        it('should emit EnergyIncrease on its own triggerBus so passives can react', () => {
            const listener = jest.fn();
            field.triggerBus.on(TriggerEvent.EnergyIncrease, listener);

            field.applyResourceGain(new Damage(attacker, 'Ult', ActionType.Ult, enemy, 15));

            expect(listener).toHaveBeenCalledWith({ unit: attacker, amount: 15, actionType: ActionType.Ult });
        });

        it('should add concentoEnergyGain to the attacker', () => {
            attacker.concentoEnergy = 5;

            field.applyResourceGain(new Damage(attacker, 'Skill', ActionType.Skill, enemy, undefined, 3));

            expect(attacker.concentoEnergy).toBe(8);
        });

        it('should accumulate gauges onto whatever the attacker already had', () => {
            attacker.gauges.set('Spectro', 10);

            field.applyResourceGain(
                new Damage(attacker, 'BA', ActionType.BA, enemy).addGauges(['Spectro', 4], ['Havoc', 7])
            );

            expect(attacker.gauges.get('Spectro')).toBe(14);
            expect(attacker.gauges.get('Havoc')).toBe(7);
        });

        it('should do nothing when the damage carries no resource gain at all', () => {
            const listener = jest.fn();
            field.triggerBus.on(TriggerEvent.EnergyIncrease, listener);

            field.applyResourceGain(new Damage(attacker, 'BA', ActionType.BA, enemy));

            expect(attacker.energy).toBe(0);
            expect(listener).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────
    // สนามรบส่งตัวเองเข้าไปตอน execute — event จึงเอื้อมถึง roster/triggerBus
    // ได้โดยไม่ต้องแนบอะไรมาตอนสร้าง (เดิม DamageEvent ต้องรับ triggerBus เอง ลืมส่ง = no-op เงียบ)
    // ─────────────────────────────────────────────
    describe('execute receives the battleField', () => {
        class SpyEvent extends CombatEvent {
            public seen: BattleField | null = null;

            constructor(name: string) {
                super(name);
                this.execute = (battleField) => { this.seen = battleField; };
            }
        }

        it('should hand itself to the event being executed', () => {
            const event = new SpyEvent('spy');
            field.schedule(event);

            field.tick();

            expect(event.seen).toBe(field);
        });

        it('should let a DamageEvent grant resources without being handed a TriggerBus', () => {
            const attacker = new AllyUnit('Attacker');
            attacker.elementType = ElementType.Spectro;
            attacker.maxEnergy   = 100;
            attacker.energy      = 0;
            const enemy = field.createEnemy('Boss');

            const listener = jest.fn();
            field.triggerBus.on(TriggerEvent.EnergyIncrease, listener);

            const damage = new Damage(attacker, 'Skill', ActionType.Skill, enemy, 20);
            field.schedule(new DamageEvent('skill-hit', damage, attacker));

            field.tick();

            expect(attacker.energy).toBe(20);
            expect(listener).toHaveBeenCalledWith({ unit: attacker, amount: 20, actionType: ActionType.Skill });
        });
    });

    // ─────────────────────────────────────────────────────────────
    // GlobalLockChange + scheduleStartCombo
    // ค้ำสัญญาเดียวที่สำคัญที่สุดของ lock: ล็อกแล้ว "ต้องมีวันปลด" เสมอ
    // ─────────────────────────────────────────────────────────────
    describe('GlobalLockChange', () => {
        it('should set isGlobalLocked to true when value is 1', () => {
            field.schedule(new GlobalLockChange('lock-on', 1));
            field.tick();

            expect(field.isGlobalLocked).toBe(true);
        });

        it('should set isGlobalLocked to false when value is 0', () => {
            field.isGlobalLocked = true;

            field.schedule(new GlobalLockChange('lock-off', 0));
            field.tick();

            expect(field.isGlobalLocked).toBe(false);
        });
    });

    describe('scheduleStartCombo', () => {
        const makeEvent = (name: string) => new (class extends CombatEvent {})(name);

        it('should schedule the event itself plus a lock-on and a lock-off event', () => {
            field.scheduleStartCombo(makeEvent('combo'), 100);

            expect(field.size).toBe(3);
        });

        // ลำดับในเฟรมเดียวกันสำคัญ: ถ้า event หลักออกก่อน lock-on
        // do-while ของ RotationDirector จะเห็น locked=false แล้วหลุดไปดึง action ถัดไปทันที
        it('should turn the lock on before the event it wraps', () => {
            field.scheduleStartCombo(makeEvent('combo'), 100);

            expect(field.peek()!.name).toBe('combo-lock-on');

            field.tick();
            expect(field.isGlobalLocked).toBe(true);
        });

        it('should lock at the event frame and unlock at frame + duration', () => {
            field.scheduleStartCombo(makeEvent('combo'), 100);

            field.tick();                                    // lock-on ที่ f0
            expect(field.isGlobalLocked).toBe(true);

            field.runAll();
            expect(field.currentFrame).toBe(100);            // ปลดที่ f0 + 100 พอดี
            expect(field.isGlobalLocked).toBe(false);
        });

        // ปลดหลังสุดของเฟรม — event อื่นที่ลงพอดีเฟรมจบต้องได้ทำงานก่อน lock จะเปิด
        it('should unlock after every other event landing on the same frame', () => {
            field.scheduleStartCombo(makeEvent('combo'), 100);
            field.schedule(makeEvent('late'), 100);

            field.runAll();

            expect(field.isGlobalLocked).toBe(false);
        });

        // ไม่มี offset ให้ใส่แล้ว — event ลงที่ currentFrame เสมอ
        // คอมโบที่เริ่มกลางเกมจึงเลื่อนตาม currentFrame เองโดยอัตโนมัติ
        it('should anchor the lock window to currentFrame at call time', () => {
            field.schedule(makeEvent('warmup'), 30);
            field.runAll();                                  // เดินเวลาไปที่ f30 ก่อน

            field.scheduleStartCombo(makeEvent('combo'), 100);
            field.runAll();

            expect(field.currentFrame).toBe(130);            // 30 + 100
            expect(field.isGlobalLocked).toBe(false);
        });

        it('should never leave the lock on after the queue drains', () => {
            field.scheduleStartCombo(makeEvent('a'), 50);
            field.scheduleStartCombo(makeEvent('b'), 25);

            field.runAll();

            expect(field.isGlobalLocked).toBe(false);
        });
    });
});
