import { ActionType, StatsType } from "../../Constants/Enum";

// จำนวน echo ต่อตัวละคร — ขนาดเริ่มต้นของ level
const ECHO_COUNT = 5;

export class EchoSubstats {
    public type: StatsType;
    public level: number[] = new Array(ECHO_COUNT).fill(1); // 1 ตัวต่อ echo เริ่มที่ level 1 ทุกตัว
    public actionType?: ActionType; // ระบุเฉพาะตอน type===Dmg — แยก Basic/Heavy/Skill/Ult DMG Bonus ที่รวมกันเป็น StatsType.Dmg ตัวเดียว

    constructor(type: StatsType, actionType?: ActionType) {
        this.type = type;
        this.actionType = actionType;
    }
}
