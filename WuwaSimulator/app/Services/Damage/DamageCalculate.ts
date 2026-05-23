import { Damage } from "../../Models/Combat/Damage";
import { AllyUnit } from "../../Models/AllyUnit";
import { StatsType, ActionType, ElementType } from "../../Constants/Enum";

function getBaseDamage(damage: Damage): number {
    const attacker = damage.attacker;
    const m = damage.multipliers;

    const atk = attacker.baseAtk * (1 + attacker.getStats(StatsType.AtkP)) + attacker.getStats(StatsType.FlatAtk);
    const hp  = attacker.baseHp  * (1 + attacker.getStats(StatsType.Hp))   + attacker.getStats(StatsType.FlatHp);
    const def = attacker.baseDef * (1 + attacker.getStats(StatsType.DefP))  + attacker.getStats(StatsType.FlatDef);

    return atk * m.atk + hp * m.hp + def * m.def + m.const;
}

function getDmgBonus(damage: Damage): number {
    const attacker = damage.attacker;
    const el = damage.element;
    let bonus = attacker.getStats(StatsType.Dmg);

    for (const at of damage.actionTypeList) {
        bonus += attacker.getStats(StatsType.Dmg, el, at);
        bonus += attacker.getStats(StatsType.Dmg, ActionType.None, at);
    }

    if (el !== ElementType.None) {
        bonus += attacker.getStats(StatsType.Dmg, el, ActionType.None);
    }

    return 1 + bonus;
}

function getCritMultiplier(damage: Damage): number {
    if (!damage.isCritable) return 1;
    const attacker = damage.attacker;
    const cr = Math.min(attacker.getStats(StatsType.CR), 1);
    const cd = attacker.getStats(StatsType.CD);
    return 1 + cr * cd;
}

function getDefMultiplier(attacker: AllyUnit, target: AllyUnit): number {
    const defRed = attacker.getStats(StatsType.DefRed);
    const effectiveDef = target.getStats(StatsType.FlatDef) * Math.max(0, 1 - defRed);
    // Wuthering Waves def formula: 800 / (800 + effectiveDef)
    return 800 / (800 + effectiveDef);
}

function getResMultiplier(damage: Damage, target: AllyUnit): number {
    const el = damage.element;
    const resPen = damage.attacker.getStats(StatsType.Respen);
    const elemRed = target.getStats(StatsType.ElemRed, el, ActionType.None);
    const effectiveRes = Math.max(0, elemRed - resPen);
    return 1 - effectiveRes;
}

function getDmgReduction(target: AllyUnit): number {
    return Math.max(0, 1 - target.getStats(StatsType.DmgRed));
}

export function calculateDamage(damage: Damage, target: AllyUnit): number {
    const base      = getBaseDamage(damage);
    const dmgBonus  = getDmgBonus(damage);
    const crit      = getCritMultiplier(damage);
    const amp       = 1 + damage.attacker.getStats(StatsType.Amp);
    const def       = getDefMultiplier(damage.attacker, target);
    const res       = getResMultiplier(damage, target);
    const reduction = getDmgReduction(target);

    return base * dmgBonus * crit * amp * def * res * reduction;
}
