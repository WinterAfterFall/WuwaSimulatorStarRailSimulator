// app/Models/Hero.ts
import { StatsType, ActionType, ElementType, WeaponType } from "../../Constants/Enum";
import { AllyUnit } from "../AllyUnit";

export class Damage{
    public name : string = "";
    public attacker : AllyUnit = null as any;
    public element : ElementType = ElementType.None;
    public actionTypeList: ActionType[] = [];
    
}