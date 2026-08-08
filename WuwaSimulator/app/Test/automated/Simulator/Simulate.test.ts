import { Simulate } from '../../../Simulator/Simulate';
import { BattleField } from '../../../Simulator/BattleField';
import { TriggerBus } from '../../../Simulator/TriggerBus';
import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { RotationBuilder } from '../../../Simulator/RotationBuilder';
import { TriggerEvent, ActionType, StatsType } from '../../../Constants/Enum';

describe('Simulate — ownership & wiring', () => {
    it('should own a BattleField', () => {
        const sim = new Simulate();

        expect(sim.battleField).toBeInstanceOf(BattleField);
    });

    // sim.triggerBus เป็นทางลัดไปที่ของจริงใน battleField ไม่ใช่ตัวใหม่คนละใบ
    // ถ้าเป็นคนละใบ passive ที่ register ผ่าน sim จะไม่มีวันถูก emit จากใน event
    it('should expose the battleField own TriggerBus, not a second one', () => {
        const sim = new Simulate();

        expect(sim.triggerBus).toBeInstanceOf(TriggerBus);
        expect(sim.triggerBus).toBe(sim.battleField.triggerBus);
    });

    // test ที่ค้ำว่า Simulate ยังเป็น "global ขนาดย่อม" ไม่ใช่ global จริง
    it('should not share any state between two Simulate instances', () => {
        const simA = new Simulate();
        const simB = new Simulate();

        expect(simA.battleField).not.toBe(simB.battleField);
        expect(simA.triggerBus).not.toBe(simB.triggerBus);
    });
});

describe('Simulate — roster', () => {
    it('should put an added ally into the battleField', () => {
        const sim  = new Simulate();
        const unit = new AllyUnit('Mornye');

        sim.addAlly(unit);

        expect(sim.battleField.allies).toEqual([unit]);
    });

    it('should return the ally that was added, so the caller can keep a handle', () => {
        const sim  = new Simulate();
        const unit = new AllyUnit('Mornye');

        expect(sim.addAlly(unit)).toBe(unit);
    });

    // กับดักที่ CLAUDE.md เตือนไว้: ถ้าลืมตั้ง onFieldChar เอง unit.setFree() จะ no-op เงียบๆ
    // ตัวละครค้าง Busy ตลอดไป — ให้ Simulate ตั้งให้ตั้งแต่ตัวแรกจะได้ไม่มีใครลืม
    it('should make the first ally the on-field character', () => {
        const sim   = new Simulate();
        const first = sim.addAlly(new AllyUnit('First'));

        sim.addAlly(new AllyUnit('Second'));

        expect(sim.battleField.onFieldChar).toBe(first);
    });

    it('should spawn an enemy into the battleField', () => {
        const sim   = new Simulate();
        const enemy = sim.spawnEnemy('Dummy');

        expect(enemy).toBeInstanceOf(EnemyUnit);
        expect(sim.battleField.enemies).toEqual([enemy]);
    });
});

// เหตุผลทั้งหมดของการมี method พวกนี้บน Simulate: คนเรียกไม่ต้องถือ triggerBus ไว้เอง
describe('Simulate — energy', () => {
    let sim : Simulate;
    let unit: AllyUnit;

    beforeEach(() => {
        sim  = new Simulate();
        unit = sim.addAlly(new AllyUnit('Attacker'));
        unit.maxEnergy = 100;
        unit.energy    = 0;
    });

    it('should add the amount to unit.energy without being handed a TriggerBus', () => {
        sim.increaseEnergy(unit, 30);

        expect(unit.energy).toBe(30);
    });

    it('should clamp energy at maxEnergy', () => {
        unit.energy = 90;

        sim.increaseEnergy(unit, 30);

        expect(unit.energy).toBe(100);
    });

    // พิสูจน์ว่ามันยิงผ่าน bus ตัวเดียวกับที่ตัวละคร register passive ไว้ ไม่ใช่ bus ตัวใหม่
    it('should emit on the same TriggerBus that passives register on', () => {
        const seen: number[] = [];
        sim.triggerBus.on(TriggerEvent.EnergyIncrease, ctx => seen.push(ctx.amount));

        sim.increaseEnergy(unit, 30);

        expect(seen).toEqual([30]);
    });

    // listener ต้องเห็นค่าดิบก่อนโดน clamp ถึงจะเขียน passive แบบ "energy ล้นแปลงเป็นบัพ" ได้
    it('should report the pre-clamp amount to listeners', () => {
        unit.energy = 90;
        const seen: number[] = [];
        sim.triggerBus.on(TriggerEvent.EnergyIncrease, ctx => seen.push(ctx.amount));

        sim.increaseEnergy(unit, 30);

        expect(seen).toEqual([30]);
        expect(unit.energy).toBe(100);
    });

    it('should pass the actionType through to listeners when given', () => {
        const seen: (ActionType | undefined)[] = [];
        sim.triggerBus.on(TriggerEvent.EnergyIncrease, ctx => seen.push(ctx.actionType));

        sim.increaseEnergy(unit, 10, ActionType.BA);

        expect(seen).toEqual([ActionType.BA]);
    });
});

describe('Simulate — run', () => {
    const emptyQueue = () => new RotationBuilder().build();

    it('should drain the setup queue once, then loop the loop queue maxLoops times', () => {
        const sim = new Simulate();
        const order: string[] = [];

        sim.run(
            new RotationBuilder().add('setup', () => order.push('setup')).build(),
            new RotationBuilder().add('loop',  () => order.push('loop')).build(),
            2
        );

        expect(order).toEqual(['setup', 'loop', 'loop']);
    });

    it('should report how many loops were completed', () => {
        const sim = new Simulate();

        const loops = sim.run(
            emptyQueue(),
            new RotationBuilder().add('loop', () => {}).build(),
            3
        );

        expect(loops).toBe(3);
    });

    // ค้ำว่ารันซ้ำใน sim เดิมได้โดย stats ไม่ค้างจากรอบก่อน
    it('should reset every unit back to its default stats before running', () => {
        const sim  = new Simulate();
        const unit = sim.addAlly(new AllyUnit('Mornye'));
        unit.setDefaultStat(StatsType.AtkP, 0.1);
        unit.setStat(StatsType.AtkP, 0.9);

        sim.run(emptyQueue(), emptyQueue(), 0);

        expect(unit.getStats(StatsType.AtkP)).toBe(0.1);
    });
});
