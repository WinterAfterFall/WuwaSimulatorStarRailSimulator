import { ActionType, StatsType } from "../../Constants/Enum";

export interface EchoSubstat {
    type: StatsType;
    tier: number;
    actionType?: ActionType; // ระบุเฉพาะตอน type===Dmg — แยก Basic/Heavy/Skill/Ult DMG Bonus ที่รวมกันเป็น StatsType.Dmg ตัวเดียว
}

export class Echo {
    public substats: EchoSubstat[] = [];
}
