// app/Models/Hero.ts
import { Unit } from "./Unit";
import { StatsType, ActionType, ElementType, WeaponType } from "../Constants/Enum";

export class AllyUnit extends Unit {

    public energy : number = 0;
    public maxEnergy : number = 0;
    public elementType : ElementType = ElementType.None;
    public weaponType : WeaponType = WeaponType.None;
    public resonanceChain : number = 0; 
    public baseAtk : number = 0;
    public baseHp : number = 0;
    public baseDef : number = 0;

    public currentHP : number = 0;
    public currentSheild : number = 0; 

    public stacks: Map<string, number> = new Map();
    public buffNote: Map<string, number> = new Map();
    public buffCheck: Map<string, boolean> = new Map();

    public dmgRecord : Map<string, number> = new Map();
    public maxDmgRecord : Map<string, number> = new Map();

    constructor(name: string) {
        super(name); // ต้องเรียก super() ก่อนเสมอเพื่อใช้งาน this
    }

}