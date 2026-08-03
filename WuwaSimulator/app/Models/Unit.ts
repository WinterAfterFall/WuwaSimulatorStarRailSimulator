import { UnitStatus, StatsType, ActionType, ElementType ,Side} from "../Constants/Enum";

export class Unit {
    public stats: Map<string, number> = new Map();
    public defaultStats: Map<string, number> = new Map(); // ค่าที่ reset() จะเซ็ตกลับไปหา — ไม่ auto-populate ตอนสร้าง ต้อง set เองถ้าต้องการ
    public status: UnitStatus = UnitStatus.Alive;
    public name: string;
    public side : Side = Side.None;
    constructor(name: string);
    constructor(name: string, initialStats: Partial<Record<StatsType, number>>);
    constructor(name: string, initialStats?: Partial<Record<StatsType, number>>) {
        this.name = name;

        if (initialStats) {
            // เมื่อเป็น String Enum เราสามารถวน Loop ได้โดยตรง
            for (const [key, value] of Object.entries(initialStats)) {
                if (value !== undefined) {
                    this.setStat(key as StatsType, value);
                }
            }
        }
    }

    private generateKey(st: StatsType, atOrEt?: ActionType | ElementType, at?: ActionType): string {
        // 1. กรณีรับแค่ Stat อย่างเดียว -> "Atk%"
        if (atOrEt === undefined) {
            return st;
        }

        // 2. กรณีรับ Stat + Element หรือ Stat + Action -> "Dmg Bonus-Glacio" หรือ "Atk%-BA"
        if (at === undefined) {
            return `${st}-${atOrEt}`;
        }

        // 3. กรณีรับครบ 3 ตัว (Stat-Element-Action) -> "Dmg Bonus-Glacio-BA"
        return `${st}-${atOrEt}-${at}`;
    }

    // --- Lifecycle helpers ---
    public isAlive(): boolean {
        return this.status === UnitStatus.Alive;
    }

    public setDead(): void {
        this.status = UnitStatus.Death;
    }

    // --- Get Stats ---
    public getStats(st: StatsType): number;
    public getStats(st: StatsType, at: ActionType): number;
    public getStats(st: StatsType, et: ElementType, at: ActionType): number;
    public getStats(st: StatsType, arg2?: ActionType | ElementType, arg3?: ActionType): number {
        const key = this.generateKey(st, arg2, arg3);
        return this.stats.get(key) ?? 0;
    }

    // --- Set Stat ---
    public setStat(st: StatsType, value: number): void;
    public setStat(st: StatsType, at: ActionType, value: number): void;
    public setStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public setStat(st: StatsType, arg2: ActionType | ElementType | number, arg3?: ActionType | number, arg4?: number): void {
        let key: string;
        let val: number;

        if (arg3 === undefined && arg4 === undefined) {
            key = this.generateKey(st);
            val = arg2 as number;
        } else if (arg4 === undefined) {
            key = this.generateKey(st, arg2 as ActionType | ElementType);
            val = arg3 as number;
        } else {
            key = this.generateKey(st, arg2 as ElementType, arg3 as ActionType);
            val = arg4;
        }

        if (val === undefined) throw new Error(`setStat: value is undefined for key "${key}"`);
        this.stats.set(key, val);
    }

    // --- Add Stat ---
    public addStat(st: StatsType, value: number): void;
    public addStat(st: StatsType, at: ActionType, value: number): void;
    public addStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public addStat(st: StatsType, arg2: ActionType | ElementType | number, arg3?: ActionType | number, arg4?: number): void {
        if (arg3 === undefined) {
            // แบบ 1: (st, value)
            this.setStat(st, this.getStats(st) + (arg2 as number));
        } else if (arg4 === undefined) {
            // แบบ 2: (st, at, value)
            this.setStat(st, arg2 as ActionType, this.getStats(st, arg2 as ActionType) + (arg3 as number));
        } else {
            // แบบ 3: (st, et, at, value)
            this.setStat(st, arg2 as ElementType, arg3 as ActionType, this.getStats(st, arg2 as ElementType, arg3 as ActionType) + arg4);
        }
    }

    // --- Has Stat ---
    public hasStat(st: StatsType): boolean;
    public hasStat(st: StatsType, at: ActionType): boolean;
    public hasStat(st: StatsType, et: ElementType, at: ActionType): boolean;
    public hasStat(st: StatsType, arg2?: ActionType | ElementType, arg3?: ActionType): boolean {
        return this.stats.has(this.generateKey(st, arg2, arg3));
    }

    // --- initDefaultStats ---
    // 1. เคลียร์ค่าเดิมทุก key ที่มีอยู่ใน stats ให้เป็น 0 ก่อน (set ทับ key เดิม ไม่ clear()/สร้าง Map ใหม่ — reuse backing store เดิม ไม่มี rehash)
    // 2. วน defaultStats ทั้งหมดแล้ว set ทับเข้า stats — ครอบคลุมทั้ง key ที่มีอยู่แล้วและ key ที่ยังไม่เคยอยู่ใน stats มาก่อน
    //    (แก้บั๊กเดิมที่วนแค่ key ใน stats.keys() ทำให้ stat ที่ตั้งผ่าน addDefaultStat/setDefaultStat อย่างเดียว เช่น Mornye's DefP/HealBonus ไม่เคยถูก populate เข้า stats เลย)
    public initDefaultStats(): void {
        for (const key of this.stats.keys()) {
            this.stats.set(key, 0);
        }
        for (const [key, value] of this.defaultStats) {
            this.stats.set(key, value);
        }
    }

    // --- Get Default Stat --- (อิงหลักการเดียวกับ getStats แต่อ่านจาก defaultStats)
    public getDefaultStats(st: StatsType): number;
    public getDefaultStats(st: StatsType, at: ActionType): number;
    public getDefaultStats(st: StatsType, et: ElementType, at: ActionType): number;
    public getDefaultStats(st: StatsType, arg2?: ActionType | ElementType, arg3?: ActionType): number {
        const key = this.generateKey(st, arg2, arg3);
        return this.defaultStats.get(key) ?? 0;
    }

    // --- Set Default Stat --- (อิงหลักการเดียวกับ setStat แต่เขียนลง defaultStats)
    public setDefaultStat(st: StatsType, value: number): void;
    public setDefaultStat(st: StatsType, at: ActionType, value: number): void;
    public setDefaultStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public setDefaultStat(st: StatsType, arg2: ActionType | ElementType | number, arg3?: ActionType | number, arg4?: number): void {
        let key: string;
        let val: number;

        if (arg3 === undefined && arg4 === undefined) {
            key = this.generateKey(st);
            val = arg2 as number;
        } else if (arg4 === undefined) {
            key = this.generateKey(st, arg2 as ActionType | ElementType);
            val = arg3 as number;
        } else {
            key = this.generateKey(st, arg2 as ElementType, arg3 as ActionType);
            val = arg4;
        }

        if (val === undefined) throw new Error(`setDefaultStat: value is undefined for key "${key}"`);
        this.defaultStats.set(key, val);
    }

    // --- Add Default Stat --- (อิงหลักการเดียวกับ addStat แต่บวกเข้า defaultStats)
    public addDefaultStat(st: StatsType, value: number): void;
    public addDefaultStat(st: StatsType, at: ActionType, value: number): void;
    public addDefaultStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public addDefaultStat(st: StatsType, arg2: ActionType | ElementType | number, arg3?: ActionType | number, arg4?: number): void {
        if (arg3 === undefined) {
            // แบบ 1: (st, value)
            this.setDefaultStat(st, this.getDefaultStats(st) + (arg2 as number));
        } else if (arg4 === undefined) {
            // แบบ 2: (st, at, value)
            this.setDefaultStat(st, arg2 as ActionType, this.getDefaultStats(st, arg2 as ActionType) + (arg3 as number));
        } else {
            // แบบ 3: (st, et, at, value)
            this.setDefaultStat(st, arg2 as ElementType, arg3 as ActionType, this.getDefaultStats(st, arg2 as ElementType, arg3 as ActionType) + arg4);
        }
    }

    // --- Has Default Stat --- (อิงหลักการเดียวกับ hasStat แต่เช็คใน defaultStats)
    public hasDefaultStat(st: StatsType): boolean;
    public hasDefaultStat(st: StatsType, at: ActionType): boolean;
    public hasDefaultStat(st: StatsType, et: ElementType, at: ActionType): boolean;
    public hasDefaultStat(st: StatsType, arg2?: ActionType | ElementType, arg3?: ActionType): boolean {
        return this.defaultStats.has(this.generateKey(st, arg2, arg3));
    }
}