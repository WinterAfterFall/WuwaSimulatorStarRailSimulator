import { pickBestTuneUpSlot, pickBestDecreaseSlot, getTuneUpChance } from '../../../../extra/substats/SubstatProbability';

describe('pickBestTuneUpSlot', () => {
    it('picks index 0 when all slots tie (leans left)', () => {
        const result = pickBestTuneUpSlot('crit', [1, 1, 1, 1, 1]);

        expect(result.index).toBe(0);
        expect(result.chance).toBeCloseTo(getTuneUpChance('crit', 1) / 100);
    });

    it('moves past a higher-tier (lower-chance) slot to a lower-tier one', () => {
        const result = pickBestTuneUpSlot('crit', [3, 1, 1, 1, 1]);

        expect(result.index).toBe(1);
        expect(result.chance).toBeCloseTo(getTuneUpChance('crit', 1) / 100);
    });

    it('falls through to the last slot when every earlier slot loses in sequence', () => {
        const result = pickBestTuneUpSlot('crit', [5, 4, 3, 2, 1]);

        expect(result.index).toBe(4);
        expect(result.chance).toBeCloseTo(getTuneUpChance('crit', 1) / 100);
    });
});

describe('pickBestDecreaseSlot', () => {
    it('picks the highest-tier eligible slot (smallest chance still below threshold)', () => {
        // tier5=.14 tier3=.3 tier7=.03 tier1=level1(ineligible) tier2=.533
        const index = pickBestDecreaseSlot('crit', [5, 3, 7, 1, 2], 0.30);

        expect(index).toBe(2);
    });

    it('returns null when every slot is already at tier 1', () => {
        const index = pickBestDecreaseSlot('crit', [1, 1, 1, 1, 1], 0.9);

        expect(index).toBeNull();
    });

    it('returns null when no slot has a chance below the threshold', () => {
        const index = pickBestDecreaseSlot('crit', [2, 2, 2, 2, 2], 0.4);

        expect(index).toBeNull();
    });
});
