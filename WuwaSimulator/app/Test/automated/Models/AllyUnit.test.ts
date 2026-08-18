import { AllyUnit } from '../../../Models/AllyUnit';
import { StatsType, ActionType } from '../../../Constants/Enum';
import { SUBSTAT_VALUES } from '../../../extra/substats/SubstatValueData';
import { getTuneUpChance, getMaxTier } from '../../../extra/substats/SubstatProbability';

describe('AllyUnit', () => {
    describe('applySubstats', () => {
        it('does nothing when substats is undefined', () => {
            const ally = new AllyUnit('Ally');

            expect(() => ally.applySubstats()).not.toThrow();
            expect(ally.getStats(StatsType.AtkP)).toBe(0);
        });

        it('sums all 5 tier rolls of a substat into the real stat', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.AtkP }]);
            ally.substats![0].level = [2, 4, 6, 8, 1];

            ally.applySubstats();

            const values = SUBSTAT_VALUES[StatsType.AtkP]!;
            const expected = values[1] + values[3] + values[5] + values[7] + values[0];
            expect(ally.getStats(StatsType.AtkP)).toBeCloseTo(expected);
        });

        it('applies Dmg-type substats under their actionType key, not the bare Dmg key', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.Dmg, actionType: ActionType.BA }]);
            ally.substats![0].level = [3, 3, 3, 3, 3];

            ally.applySubstats();

            const values = SUBSTAT_VALUES[StatsType.Dmg]!;
            const expected = values[2] * 5;
            expect(ally.getStats(StatsType.Dmg, ActionType.BA)).toBeCloseTo(expected);
            expect(ally.getStats(StatsType.Dmg)).toBe(0);
        });

        it('adds on top of the existing stat value instead of overwriting it', () => {
            const ally = new AllyUnit('Ally');
            ally.setStat(StatsType.CR, 5);
            ally.setSubstats(0, [{ type: StatsType.CR }]);
            ally.substats![0].level = [1, 1, 1, 1, 1];

            ally.applySubstats();

            const values = SUBSTAT_VALUES[StatsType.CR]!;
            expect(ally.getStats(StatsType.CR)).toBeCloseTo(5 + values[0] * 5);
        });
    });

    describe('setSubstats — tier tuning', () => {
        it('tunes substats[0] up to max tier on every slot when the budget is unlimited (0)', () => {
            const ally = new AllyUnit('Ally');

            ally.setSubstats(0, [{ type: StatsType.CR }]);

            const maxTier = getMaxTier('crit');
            expect(ally.substats![0].level).toEqual(new Array(5).fill(maxTier));
        });

        it('stops partway through when the budget runs out, without ever throwing', () => {
            const ally = new AllyUnit('Ally');

            expect(() => ally.setSubstats(1e-20, [{ type: StatsType.CR }])).not.toThrow();

            // budget เล็กมากแต่ไม่ใช่ 0 เป๊ะ — โตขึ้นเรื่อยๆ จนเกินโอกาส tune tier7->8 (3%) ก่อนจะไปถึง
            expect(ally.substats![0].level).toEqual([7, 7, 7, 7, 7]);
        });

        it('leaves substats[0] at tier 1 when the post-loop budget already exceeds the first tune-up chance', () => {
            const ally = new AllyUnit('Ally');
            const chance = getTuneUpChance('crit', 1) / 100;
            const postLoopBudget = chance + 0.01;
            const inputBudget = postLoopBudget / 13; // size=1 -> loop multiplies budget by 13/1

            ally.setSubstats(inputBudget, [{ type: StatsType.CR }]);

            expect(ally.substats![0].level).toEqual([1, 1, 1, 1, 1]);
            expect(ally.luckBudget).toBeCloseTo(postLoopBudget);
        });

        it('only tunes substats[0], leaving later entries untouched', () => {
            const ally = new AllyUnit('Ally');

            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.AtkP }]);

            expect(ally.substats![1].level).toEqual([1, 1, 1, 1, 1]);
        });
    });
});
