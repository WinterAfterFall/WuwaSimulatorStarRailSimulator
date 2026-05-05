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

    // --- Type Guards (ปรับปรุงเพื่อรองรับ String Enum) ---
    private isElementType(value: any): value is ElementType {
        return Object.values(ElementType).includes(value);
    }

    private generateKey(st: StatsType, atOrEt?: ActionType | ElementType, at?: ActionType): string {
        // 1. กรณีรับแค่ Stat อย่างเดียว -> "AtkP"
        if (atOrEt === undefined) {
            return st;
        }

        // 2. กรณีรับ 2 พารามิเตอร์ (แยกว่าตัวที่สองคือ Element หรือ Action)
        if (at === undefined) {
            if (this.isElementType(atOrEt)) {
                // เป็น Element -> "AtkP-Glacio-None" (ใช้ Enum.None แทนเลข 0)
                return `${st}-${atOrEt}-${ActionType.None}`;
            } else {
                // เป็น Action -> "AtkP-None-BA"
                return `${st}-${ElementType.None}-${atOrEt}`;
            }
        }

        // 3. กรณีรับครบ 3 ตัว (Stat-Element-Action) -> "AtkP-Glacio-BA"
        return `${st}-${atOrEt}-${at}`;
    }

    // --- Get Stats ---
    public getStats(st: StatsType): number;
    public getStats(st: StatsType, at: ActionType): number;
    public getStats(st: StatsType, et: ElementType, at: ActionType): number;
    public getStats(st: StatsType, arg2?: any, arg3?: any): number {
        const key = this.generateKey(st, arg2, arg3);
        return this.stats.get(key) || 0;
    }

    // --- Set Stat ---
    public setStat(st: StatsType, value: number): void;
    public setStat(st: StatsType, at: ActionType, value: number): void;
    public setStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public setStat(st: StatsType, arg2: any, arg3?: any, arg4?: any): void {
        let key: string;
        let val: number;

        if (arg3 === undefined && arg4 === undefined) {
            key = this.generateKey(st);
            val = arg2;
        } else if (arg4 === undefined) {
            key = this.generateKey(st, arg2);
            val = arg3;
        } else {
            key = this.generateKey(st, arg2, arg3);
            val = arg4;
        }

        if (val !== undefined) this.stats.set(key, val);
    }

    // --- Add Stat ---
    public addStat(st: StatsType, value: number): void;
    public addStat(st: StatsType, at: ActionType, value: number): void;
    public addStat(st: StatsType, et: ElementType, at: ActionType, value: number): void;
    public addStat(st: StatsType, arg2: any, arg3?: any, arg4?: any): void {
        if (arg3 === undefined) {
            // แบบ 1: (st, value)
            this.setStat(st, this.getStats(st) + arg2);
        } else if (arg4 === undefined) {
            // แบบ 2: (st, atOrEt, value)
            this.setStat(st, arg2, this.getStats(st, arg2) + arg3);
        } else {
            // แบบ 3: (st, et, at, value)
            this.setStat(st, arg2, arg3, this.getStats(st, arg2, arg3) + arg4);
        }
    }
}