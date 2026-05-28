import { UnitStatus, StatsType, ActionType, ElementType ,Side} from "../Constants/Enum";

export class Unit {
    public stats: Map<string, number> = new Map();
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
}