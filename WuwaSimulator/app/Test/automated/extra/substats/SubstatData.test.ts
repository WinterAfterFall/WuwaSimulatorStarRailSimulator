import { getTableKeyForStat } from '../../../../extra/substats/SubstatData';
import { StatsType } from '../../../../Constants/Enum';

describe('getTableKeyForStat', () => {
    it.each([
        [StatsType.AtkP, 'main'],
        [StatsType.DefP, 'main'],
        [StatsType.Hp, 'main'],
        [StatsType.FlatHp, 'main'],
        [StatsType.Dmg, 'main'],
        [StatsType.EnergyRegen, 'main'],
        [StatsType.CR, 'crit'],
        [StatsType.CD, 'crit'],
        [StatsType.FlatAtk, 'flatAtk'],
        [StatsType.FlatDef, 'flatDef'],
    ] as const)('maps %s to table "%s"', (type, expected) => {
        expect(getTableKeyForStat(type)).toBe(expected);
    });

    it('throws for a StatsType that has no substat table', () => {
        expect(() => getTableKeyForStat(StatsType.Amp)).toThrow();
    });
});
