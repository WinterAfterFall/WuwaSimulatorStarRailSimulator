import { AllyUnit } from '../../../Models/AllyUnit';
import { EnemyUnit } from '../../../Models/EnemyUnit';
import { EchoSubstats } from '../../../extra/substats/EchoSubstats';
import { StatsType, ActionType } from '../../../Constants/Enum';
import { SUBSTAT_VALUES } from '../../../extra/substats/SubstatValueData';
import { getTuneUpChance, getMaxTier } from '../../../extra/substats/SubstatProbability';

describe('AllyUnit', () => {
    describe('totalDamageRecord / maxTotalDamageRecord / allyNum', () => {
        it('defaults totalDamageRecord and maxTotalDamageRecord to 0', () => {
            const ally = new AllyUnit('Ally');

            expect(ally.totalDamageRecord).toBe(0);
            expect(ally.maxTotalDamageRecord).toBe(0);
        });

        it('defaults allyNum to 0', () => {
            const ally = new AllyUnit('Ally');

            expect(ally.allyNum).toBe(0);
        });
    });

    describe('updateMaxRecords', () => {
        it('returns false and leaves every record untouched when totalDamageRecord does not beat the record', () => {
            const ally = new AllyUnit('Ally');
            ally.totalDamageRecord    = 100;
            ally.maxTotalDamageRecord = 100;
            ally.dmgRecord.set('BA', 100);

            const enemy = new EnemyUnit('Boss');
            enemy.totalDamageRecord[0]    = 100;
            enemy.maxTotalDamageRecord[0] = 999;

            const isNewRecord = ally.updateMaxRecords([enemy]);

            expect(isNewRecord).toBe(false);
            expect(ally.maxDmgRecord.size).toBe(0);
            expect(ally.maxTotalDamageRecord).toBe(100);
            expect(enemy.maxTotalDamageRecord[0]).toBe(999);
        });

        it('snapshots dmgRecord into maxDmgRecord when totalDamageRecord beats the record', () => {
            const ally = new AllyUnit('Ally');
            ally.totalDamageRecord    = 500;
            ally.maxTotalDamageRecord = 300;
            ally.dmgRecord.set('BA', 200);
            ally.dmgRecord.set('Ult', 300);

            const isNewRecord = ally.updateMaxRecords([]);

            expect(isNewRecord).toBe(true);
            expect(ally.maxDmgRecord.get('BA')).toBe(200);
            expect(ally.maxDmgRecord.get('Ult')).toBe(300);
            expect(ally.maxTotalDamageRecord).toBe(500);
        });

        it("updates every enemy's maxTotalDamageRecord at this ally's index when the record breaks", () => {
            const ally = new AllyUnit('Ally');
            ally.allyNum = 2;
            ally.totalDamageRecord    = 500;
            ally.maxTotalDamageRecord = 300;

            const enemyA = new EnemyUnit('A');
            enemyA.totalDamageRecord[2] = 400;
            const enemyB = new EnemyUnit('B');
            enemyB.totalDamageRecord[2] = 100;

            ally.updateMaxRecords([enemyA, enemyB]);

            expect(enemyA.maxTotalDamageRecord[2]).toBe(400);
            expect(enemyB.maxTotalDamageRecord[2]).toBe(100);
        });

        it("does not touch other allies' slots in an enemy's record arrays", () => {
            const ally = new AllyUnit('Ally');
            ally.allyNum = 1;
            ally.totalDamageRecord    = 500;
            ally.maxTotalDamageRecord = 0;

            const enemy = new EnemyUnit('Boss');
            enemy.totalDamageRecord[0]    = 999;
            enemy.maxTotalDamageRecord[0] = 999;
            enemy.totalDamageRecord[1]    = 500;

            ally.updateMaxRecords([enemy]);

            expect(enemy.maxTotalDamageRecord[0]).toBe(999);
            expect(enemy.maxTotalDamageRecord[1]).toBe(500);
        });
    });

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

    describe('rerollSubstats', () => {
        it('does nothing when substats is undefined', () => {
            const ally = new AllyUnit('Ally');

            expect(ally.rerollSubstats()).toBe(false);
        });

        it('does nothing when there is only one substat to consider (nothing to trade with)', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }]);

            expect(ally.rerollSubstats()).toBe(false);
        });

        it('trades 1 tier from the earlier substat into the later one on a single call', () => {
            const ally = new AllyUnit('Ally');
            // substats[0] (CR) ถูก tune ไปที่ [8,8,8,8,8] เองจาก setSubstats(budget=0) — bestSubstats sync ตามด้วย
            // substats[1] (CD) ยังไม่ถูกแตะเลย เริ่มที่ [1,1,1,1,1]
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }]);

            const changed = ally.rerollSubstats();

            expect(changed).toBe(true);
            // target: substats[1] slot 0 (tie เลือกซ้าย) ได้ +1
            expect(ally.substats![1].level).toEqual([2, 1, 1, 1, 1]);
            // source: substats[0] slot 0 (tier สูงสุดเท่ากันหมด เลือกตัวแรกที่เจอ) โดน -1
            expect(ally.substats![0].level).toEqual([7, 8, 8, 8, 8]);
            expect(ally.rerollSourceIndex).toBe(0);
        });

        it('returns false immediately when every substat is stuck at tier 1 (nothing tradeable anywhere)', () => {
            const ally = new AllyUnit('Ally');
            const chance = getTuneUpChance('crit', 1) / 100;
            const postLoopBudget = chance + 0.01;
            // size=3 -> loop คูณ budget ด้วย (13*12*11)/(3*2*1) = 286
            const inputBudget = postLoopBudget / 286;
            ally.setSubstats(inputBudget, [{ type: StatsType.CR }, { type: StatsType.CD }, { type: StatsType.AtkP }]);

            expect(ally.rerollSubstats()).toBe(false);
            expect(ally.substats!.map(s => s.level)).toEqual([
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
            ]);
        });

        // ทิศทางของ sweep เป็นตัวเลือกที่ตั้งใจ (เลือกไล่ขึ้นเพราะอ่านง่ายกว่า) ไม่ใช่ของที่หลุดมา —
        // ลำดับมีผลต่อผลลัพธ์จริง เพราะแต่ละคอลจบทันทีที่แลกสำเร็จตัวแรก test นี้จึงปักหมุดไว้
        it('sweeps sources from substats[0] upward toward the target', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [
                { type: StatsType.CR },
                { type: StatsType.CD },
                { type: StatsType.AtkP },
            ]);
            // source ทั้งสองตัวต้องมี tier ให้ลดจริง และ chance ต้องต่ำกว่า threshold ของ target
            // (target เป็น main tier 1 = chance สูงสุด, source เป็น crit tier 6 = chance ต่ำ)
            ally.substats![0].level = [6, 6, 6, 6, 6];
            ally.substats![1].level = [6, 6, 6, 6, 6];
            ally.substats![2].level = [1, 1, 1, 1, 1];
            ally.bestSubstats = ally.substats!.map(s => {
                const copy = new EchoSubstats(s.type, s.actionType);
                copy.level = [...s.level];
                return copy;
            });
            ally.rerollSubstatIndex = 2;

            const visited: number[] = [];
            expect(ally.rerollSubstats()).toBe(true);
            visited.push(ally.rerollSourceIndex);
            expect(ally.rerollSubstats()).toBe(true);
            visited.push(ally.rerollSourceIndex);

            expect(visited).toEqual([0, 1]);   // ไล่ขึ้นจาก 0 — ไม่ใช่ [1, 0]
        });

        it('skips a source with nothing eligible to decrease and tries the next one up within the same call', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }, { type: StatsType.AtkP }]);
            // substats[0] (source ตัวแรกที่จะถูกลอง) ถูกบังคับเป็น tier 1 ล้วน — ไม่มีอะไรให้ลด ต้องถูกข้าม
            // ส่วน substats[1] ดัน tier ขึ้นให้แลกได้จริง จะได้พิสูจน์ว่า "ข้ามแล้วไปต่อ" ทำงานจริง
            ally.substats![0].level = [1, 1, 1, 1, 1];
            ally.substats![1].level = [6, 6, 6, 6, 6];
            ally.substats![2].level = [1, 1, 1, 1, 1];
            ally.bestSubstats = ally.substats!.map(s => {
                const copy = new EchoSubstats(s.type, s.actionType);
                copy.level = [...s.level];
                return copy;
            });
            ally.rerollSubstatIndex = 2; // target = substats[2], candidates = substats[0] (ข้าม) แล้ว substats[1]

            const changed = ally.rerollSubstats();

            expect(changed).toBe(true);
            expect(ally.rerollSourceIndex).toBe(1); // ข้าม 0 (ไม่ผ่าน) ไปเจอ 1 (ผ่าน) ในคอลเดียว
            expect(ally.substats![0].level).toEqual([1, 1, 1, 1, 1]); // ไม่ถูกแตะเลย
        });

        it('updates luckBudget — divides by the buy chance, multiplies by the sell chance', () => {
            const ally = new AllyUnit('Ally');
            // budget เล็กมากแต่ไม่ใช่ 0 -> substats[0] (CR) หยุดที่ [7,7,7,7,7] (ดู "stops partway through" test)
            // luckBudget เหลือค่าที่แน่นอน (budget ก่อนพยายาม tune 7->8 ที่ไม่พอ) ใช้เป็นจุดเริ่มที่รู้ค่าแน่นอนได้
            ally.setSubstats(1e-20, [{ type: StatsType.CR }]);
            const budgetBeforeReroll = ally.luckBudget;
            ally.substats!.push(new EchoSubstats(StatsType.CD));
            ally.bestSubstats!.push(new EchoSubstats(StatsType.CD));

            ally.rerollSubstats();

            // target (CD) slot0 tier1 -> tier2: ซื้อด้วย chance ของ tier1
            const buyChance = getTuneUpChance('crit', 1) / 100;
            // source (CR) slot0 tier7 -> tier6: ขายคืนด้วย chance ของ tier6 (tier ที่เหลือหลังลด)
            const sellChance = getTuneUpChance('crit', 6) / 100;
            const expected = (budgetBeforeReroll / buyChance) * sellChance;

            expect(ally.luckBudget).toBeCloseTo(expected);
        });

        it('advances rerollSubstatIndex and resets rerollSourceIndex once a full sweep finds nothing better', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }, { type: StatsType.AtkP }]);
            // ทุกตัวอยู่ tier 1 ล้วน (override ทับผลจาก setSubstats) — ไม่มี source ไหนแลกได้เลยไม่ว่า target ไหน
            for (const s of ally.substats!) s.level = [1, 1, 1, 1, 1];
            ally.bestSubstats = ally.substats!.map(s => {
                const copy = new EchoSubstats(s.type, s.actionType);
                copy.level = [...s.level];
                return copy;
            });
            ally.rerollSubstatIndex = 1;

            const result = ally.rerollSubstats();

            // ไม่มีอะไรแลกได้เลยไม่ว่า target ไหน -> เดินจน exceed substats.length-1 (=2) แล้ว restore จาก bestSubstats
            expect(result).toBe(false);
            expect(ally.rerollSubstatIndex).toBe(3);
            expect(ally.rerollSourceIndex).toBe(-1);
        });

        it('retries the same rerollSubstatIndex (does not advance) when updateMaxRecords() found an improvement mid-sweep', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }, { type: StatsType.AtkP }]);
            ally.rerollSubstatIndex = 2;

            ally.rerollSubstats(); // ทดสอบ source=1 (สำเร็จ) -> rerollSourceIndex=1, sweep ยังไม่จบ (1+1<2 เท็จ... )
            // จำลองว่า caller รัน sim แล้วพบว่าดีขึ้นจริง ก่อนเรียกซ้ำ
            ally.rerollImproved = true;

            const beforeIndex = ally.rerollSubstatIndex;
            ally.rerollSubstats(); // sweep จบพอดี (แค่ source เดียวเพราะ target=2 มี source ได้แค่ index 0..1)

            expect(ally.rerollSubstatIndex).toBe(beforeIndex); // ไม่เลื่อน target — retry sweep เดิมแทน
            expect(ally.rerollSourceIndex).toBe(0); // sweep ใหม่เริ่มทดสอบ source ตัวแรกอีกครั้ง แล้วสำเร็จ
        });

        it('eventually terminates when called repeatedly (no infinite loop) and restores the best-known substats', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            const bestSnapshot = ally.substats!.map(s => [...s.level]);

            let calls = 0;
            const MAX_CALLS = 200;
            while (ally.rerollSubstats() && calls < MAX_CALLS) {
                calls++;
            }

            expect(calls).toBeLessThan(MAX_CALLS);
            // ไม่มีใครเรียก updateMaxRecords() เลยระหว่างนี้ (ไม่มีการจำลองดาเมจจริง) — จบแล้วต้อง
            // คืนกลับเป็น bestSubstats เดิมเป๊ะ (คือค่าตอน setSubstats() จบ) ไม่ค้างเป็นสถานะกลางๆ
            expect(ally.substats!.map(s => s.level)).toEqual(bestSnapshot);
        });
    });

    // luckBudget ต้องเดินคู่กับ substats เสมอ — ถ้า substats ย้อนกลับได้แต่ budget ย้อนไม่ได้
    // งบจะเพี้ยนสะสมทุก sweep ที่ล้มเหลว แล้ว algorithm จะ "ซื้อ" tier ได้ผิดจากความจริง
    describe('bestLuckBudget — budget ต้อง rollback พร้อม substats', () => {
        it('seeds bestLuckBudget from the post-tune luckBudget in setSubstats()', () => {
            const ally = new AllyUnit('Ally');

            ally.setSubstats(1e-20, [{ type: StatsType.CR }, { type: StatsType.CD }]);

            expect(ally.bestLuckBudget).toBe(ally.luckBudget);
        });

        it('saves the current luckBudget into bestLuckBudget when a new record is found', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(1e-20, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            ally.luckBudget = 0.42;
            ally.totalDamageRecord    = 500;
            ally.maxTotalDamageRecord = 300;

            ally.updateMaxRecords([]);

            expect(ally.bestLuckBudget).toBe(0.42);
        });

        it('restores luckBudget alongside substats when a sweep restarts', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(1e-20, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            const budgetAtBest = ally.luckBudget;

            // sweep แรก: ลอง trade จริง 1 ครั้ง -> luckBudget ถูกแก้ไปแล้ว
            ally.rerollSubstats();
            expect(ally.luckBudget).not.toBe(budgetAtBest);

            // caller รัน sim แล้วดาเมจ "ไม่" ดีขึ้น (ไม่มีใครเรียก updateMaxRecords) -> sweep จบแบบล้มเหลว
            // -> เลื่อน target + เริ่ม sweep ใหม่ ซึ่งต้องรีเซ็ตทั้ง substats และ luckBudget กลับไปที่ best
            ally.rerollSubstats();

            expect(ally.luckBudget).toBe(budgetAtBest);
        });

        it('restores luckBudget together with substats when the whole search finishes', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            const budgetAtBest = ally.bestLuckBudget;

            let guard = 0;
            while (ally.rerollSubstats() && guard < 200) guard++;

            expect(guard).toBeLessThan(200);
            expect(ally.luckBudget).toBe(budgetAtBest);
        });
    });

    describe('updateMaxRecords — bestSubstats snapshot + rerollImproved flag', () => {
        it('snapshots substats into bestSubstats and sets rerollImproved when a new record is found', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            ally.substats![1].level = [3, 1, 1, 1, 1]; // เปลี่ยนไปจาก bestSubstats เดิม (ยัง [1,1,1,1,1])
            ally.totalDamageRecord    = 500;
            ally.maxTotalDamageRecord = 300;

            const isNewRecord = ally.updateMaxRecords([]);

            expect(isNewRecord).toBe(true);
            expect(ally.rerollImproved).toBe(true);
            expect(ally.bestSubstats![1].level).toEqual([3, 1, 1, 1, 1]);
        });

        it('does not touch bestSubstats or rerollImproved when it is not a new record', () => {
            const ally = new AllyUnit('Ally');
            ally.setSubstats(0, [{ type: StatsType.CR }, { type: StatsType.CD }]);
            const bestBefore = ally.bestSubstats!.map(s => [...s.level]);
            ally.substats![1].level = [3, 1, 1, 1, 1];
            ally.totalDamageRecord    = 100;
            ally.maxTotalDamageRecord = 100;

            const isNewRecord = ally.updateMaxRecords([]);

            expect(isNewRecord).toBe(false);
            expect(ally.rerollImproved).toBe(false);
            expect(ally.bestSubstats!.map(s => s.level)).toEqual(bestBefore);
        });
    });
});
