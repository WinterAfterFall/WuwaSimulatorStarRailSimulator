// app/Models/Hero.ts
import { StatsType, ActionType, ElementType, WeaponType } from "../../Constants/Enum";
import { AllyUnit } from "../AllyUnit";

interface SkillScaling {
  atk: number;
  hp: number;
  def: number;
  const: number; // ค่าคงที่ (Flat value)
}

export class Damage{
    public name : string = "";
    public attacker : AllyUnit = null as any;
    public element : ElementType = ElementType.None;
    public attackTypeList: ActionType[] = [];
    public isCritable : boolean = true;
    public multipliers : SkillScaling = {   
        atk : 0,
        hp : 0,
        def : 0,
        const : 0,
    }
}