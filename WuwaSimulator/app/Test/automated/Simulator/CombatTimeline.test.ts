import { CombatTimeline } from '../../../Simulator/CombatTimeline';
import { BattleField } from '../../../Simulator/BattleField';

describe('CombatTimeline — battleField ownership', () => {
    it('should own a BattleField instance', () => {
        const timeline = new CombatTimeline();
        expect(timeline.battleField).toBeInstanceOf(BattleField);
    });

    it('should start with an empty battleField', () => {
        const timeline = new CombatTimeline();
        expect(timeline.battleField.enemies).toEqual([]);
        expect(timeline.battleField.allies).toEqual([]);
    });

    // นี่คือ test ที่พิสูจน์ว่าปัญหา state รั่วข้าม simulation หายไปจริง
    it('should not share battleField between two timelines', () => {
        const timelineA = new CombatTimeline();
        const timelineB = new CombatTimeline();

        const bossA = timelineA.battleField.createEnemy('BossA');

        expect(timelineA.battleField.enemies).toEqual([bossA]);
        expect(timelineB.battleField.enemies).toEqual([]);
    });
});
