import { BattleField } from '../../../Simulator/BattleField';
import { TriggerBus } from '../../../Simulator/TriggerBus';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { Damage } from '../../../Models/Combat/Damage';
import { CombatEvent } from '../../../Models/Combat/CombatEvent/CombatEvent';
import { DamageEvent } from '../../../Models/Combat/CombatEvent/DamageEvent';
import { AttackActionEvent } from '../../../Models/Combat/CombatEvent/AttackActionEvent';
import { EnemyPosition, SkillRange, StatsType, ActionType, ElementType, TriggerEvent } from '../../../Constants/Enum';
import { SUBSTAT_VALUES } from '../../../extra/substats/SubstatValueData';

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

        it('should assign enemyNum as the index of the enemy within the roster', () => {
            const a = field.createEnemy('A');
            const b = field.createEnemy('B');
            expect(a.enemyNum).toBe(0);
            expect(b.enemyNum).toBe(1);
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
            expect(field.enemiesInRange(SkillRange.Single)).toEqual([]);
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

        it('should re-apply ally substats on top of the reset defaults', () => {
            const ally = new AllyUnit('Ally');
            ally.setDefaultStat(StatsType.AtkP, 10);
            ally.setStat(StatsType.AtkP, 10);
            ally.setSubstats(0, [{ type: StatsType.AtkP }]);
            ally.substats![0].level = [1, 1, 1, 1, 1];
            field.allies.push(ally);

            field.resetAllUnits();

            const values = SUBSTAT_VALUES[StatsType.AtkP]!;
            expect(ally.getStats(StatsType.AtkP)).toBeCloseTo(10 + values[0] * 5);
        });

        // dmgRecord/totalDamageRecord แทน "ผลของรอบนี้รอบเดียว" — ถ้าค้างข้ามรอบ การเทียบ
        // totalDamageRecord > maxTotalDamageRecord ใน updateMaxRecords() จะเป็นจริงตลอดไปแบบไร้ความหมาย
        it('should clear the per-round damage records on the ally', () => {
            const ally = new AllyUnit('Ally');
            ally.dmgRecord.set('BA', 500);
            ally.totalDamageRecord = 500;
            field.allies.push(ally);

            field.resetAllUnits();

            expect(ally.dmgRecord.size).toBe(0);
            expect(ally.totalDamageRecord).toBe(0);
        });

        it('should clear the per-round damage records on the enemy', () => {
            const enemy = field.createEnemy('Boss');
            enemy.dmgRecord.set('BA', 500);
            enemy.totalDamageRecord[0] = 500;

            field.resetAllUnits();

            expect(enemy.dmgRecord.size).toBe(0);
            expect(enemy.totalDamageRecord).toEqual([]);
        });

        // ตรงข้ามกับ per-round record — max* คือผลสรุปข้ามรอบ ต้องรอดจาก reset เสมอ
        it('should keep the all-time max records on both sides', () => {
            const ally = new AllyUnit('Ally');
            ally.maxDmgRecord.set('BA', 900);
            ally.maxTotalDamageRecord = 900;
            field.allies.push(ally);

            const enemy = field.createEnemy('Boss');
            enemy.maxDmgRecord.set('BA', 900);
            enemy.maxTotalDamageRecord[0] = 900;

            field.resetAllUnits();

            expect(ally.maxDmgRecord.get('BA')).toBe(900);
            expect(ally.maxTotalDamageRecord).toBe(900);
            expect(enemy.maxDmgRecord.get('BA')).toBe(900);
            expect(enemy.maxTotalDamageRecord[0]).toBe(900);
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
    // ค้ำสัญญาเดียวที่สำคัญที่สุดของ lock: ล็อกแล้ว "ต้องมีวันปลด" เสมอ
    // ─────────────────────────────────────────────────────────────


    // ─────────────────────────────────────────────
    // scheduleOnFieldAction / scheduleOffFieldAction
    // ─────────────────────────────────────────────
    describe('scheduleOnFieldAction', () => {
        let unit: AllyUnit;

        beforeEach(() => {
            unit = new AllyUnit('Mornye');
            field.allies.push(unit);
            field.onFieldChar = unit;
        });

        const onFieldEvent = (unit: AllyUnit) =>
            new AttackActionEvent('atk', unit, ActionType.BA, true);

        it('should hold the global lock for the whole action', () => {
            field.scheduleStartOnFieldAction(onFieldEvent(unit), 100);

            field.tick();
            expect(field.isGlobalLocked).toBe(true);

            field.runAll();
            expect(field.currentFrame).toBe(100);
            expect(field.isGlobalLocked).toBe(false);
        });

        // ปลายท่าเป็น ActionFreeEvent.onField — คืน unit เป็น Free แล้วปลด GlobalLock ในตัวเดียว
        it('should free the unit at the end of the action', () => {
            field.scheduleStartOnFieldAction(onFieldEvent(unit), 100);

            field.tick();
            expect(unit.isFree()).toBe(false);      // setBusy จาก ActionEvent

            field.runAll();
            expect(field.currentFrame).toBe(100);
            expect(unit.isFree()).toBe(true);
        });

        // event.time ที่ตั้งมาตอนสร้างทำหน้าที่เป็น offset — schedule บวก currentFrame ให้อีกที
        it('should treat the event own time as an offset from now', () => {
            const event = new AttackActionEvent('atk', 30, unit, ActionType.BA, true);

            field.scheduleStartOnFieldAction(event, 100);

            expect(field.peek()!.time).toBe(30);
        });

        // changeToAutoTime → GlobalFreeEvent ปลด lock ก่อนท่าจบ แต่ unit ยัง Busy ต่อ
        it('should release the lock early at changeToAutoTime', () => {
            field.scheduleStartOnFieldAction(onFieldEvent(unit), 100, 40);

            while (field.currentFrame < 40) field.tick();

            expect(field.isGlobalLocked).toBe(false);
            expect(unit.isFree()).toBe(false);          // ยังติดแอนิเมชันอยู่

            field.runAll();
            expect(field.currentFrame).toBe(100);
            expect(unit.isFree()).toBe(true);
        });

        it('should not schedule a GlobalFreeEvent when changeToAutoTime is omitted', () => {
            field.scheduleStartOnFieldAction(onFieldEvent(unit), 100);

            expect(field.size).toBe(2);                 // action + free เท่านั้น
        });

        // onExecute ทับ execute เดิมทั้งก้อน — ของเดิมต้องไม่ทำงานเลย
        it('should override the original execute entirely', () => {
            const seen: string[] = [];
            const event = new AttackActionEvent('atk', unit, ActionType.BA, true);
            field.appendOnExecute(event, () => seen.push('original'));

            field.scheduleStartOnFieldAction(event, 100, undefined, () => seen.push('override'));
            field.runAll();

            expect(seen).toEqual(['override']);
        });

        // ขาล็อกถูกเสียบไว้หน้าสุด "หลัง" การทับ จึงรอดแม้คนเรียกจะทับ execute ทั้งก้อน
        it('should still lock even when the execute is overridden', () => {
            const event = new AttackActionEvent('atk', unit, ActionType.BA, true);

            field.scheduleStartOnFieldAction(event, 100, undefined, () => {});
            field.tick();

            expect(unit.isFree()).toBe(false);
            expect(field.isGlobalLocked).toBe(true);
        });

        it('should lock before running the execute body', () => {
            const seen: string[] = [];
            const event = new AttackActionEvent('atk', unit, ActionType.BA, true);

            field.scheduleStartOnFieldAction(event, 100, undefined, (bf) => {
                seen.push(bf.isGlobalLocked ? 'locked' : 'open');
                seen.push(unit.isFree() ? 'free' : 'busy');
            });
            field.tick();

            expect(seen).toEqual(['locked', 'busy']);
        });

        it('should keep the original execute when no callback is given', () => {
            const event = new AttackActionEvent('atk', unit, ActionType.BA, true);

            field.scheduleStartOnFieldAction(event, 100);
            field.tick();

            expect(unit.isFree()).toBe(false);      // setBusy เดิมยังทำงาน
        });
    });

    describe('scheduleOffFieldAction', () => {
        let onField: AllyUnit;
        let offField: AllyUnit;

        beforeEach(() => {
            onField  = new AllyUnit('OnField');
            offField = new AllyUnit('OffField');
            field.allies.push(onField, offField);
            field.onFieldChar = onField;
        });

        const offFieldEvent = (unit: AllyUnit) =>
            new AttackActionEvent('coord', unit, ActionType.CoordAtk, false);

        it('should never touch the global lock', () => {
            field.scheduleStartOffFieldAction(offFieldEvent(offField), 100);

            field.runAll();

            expect(field.isGlobalLocked).toBe(false);
        });

        it('should schedule the action plus its free event', () => {
            field.scheduleStartOffFieldAction(offFieldEvent(offField), 100);

            expect(field.size).toBe(2);
        });

        it('should free the off-field unit at the end without touching the lock', () => {
            field.isGlobalLocked = true;

            field.scheduleStartOffFieldAction(offFieldEvent(offField), 100);
            field.tick();
            expect(offField.isFree()).toBe(false);      // setBusy

            field.runAll();
            expect(field.currentFrame).toBe(100);
            expect(offField.isFree()).toBe(true);
            expect(field.isGlobalLocked).toBe(true);    // ของคนอื่นต้องไม่โดนแตะ
        });

        it('should override the original execute entirely', () => {
            const seen: string[] = [];
            const event = new AttackActionEvent('coord', offField, ActionType.CoordAtk, false);
            field.appendOnExecute(event, () => seen.push('original'));

            field.scheduleStartOffFieldAction(event, 100, () => seen.push('override'));
            field.runAll();

            expect(seen).toEqual(['override']);
        });
    });
});
