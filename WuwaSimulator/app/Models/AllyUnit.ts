import { Unit } from "./Unit";
import { StatsType, ActionType, ElementType, WeaponType, ActionState } from "../Constants/Enum";

export class AllyUnit extends Unit {

    // --- Combat State ---
    public isOnField: boolean = false               // ยืนบนสนามอยู่ไหม
    public actionState: ActionState = ActionState.Free  // ว่าง หรือ กำลัง action

    // --- Base Stats ---
    public baseAtk : number = 0;
    public baseHp  : number = 0;
    public baseDef : number = 0;

    // --- Character Info ---
    public elementType    : ElementType = ElementType.None;
    public weaponType     : WeaponType  = WeaponType.None;
    public resonanceChain : number = 0;

    // --- Energy ---
    public energy    : number = 0;
    public maxEnergy : number = 0;

    // --- HP / Shield ---
    public currentHP     : number = 0;
    public currentShield : number = 0;

    // --- Buff Tracking ---
    public stacks    : Map<string, number>  = new Map();
    public buffNote  : Map<string, number>  = new Map();
    public buffCheck : Map<string, boolean> = new Map();

    // --- Damage Record ---
    public dmgRecord    : Map<string, number> = new Map();
    public maxDmgRecord : Map<string, number> = new Map();

    constructor(name: string) {
        super(name);
    }

    /** รันเมื่อถึงเวลาของ event — subclass override เพื่อกำหนด logic เอง */
    public execute(action: ActionType): void {}

    public isFree(): boolean {
        return this.actionState === ActionState.Free;
    }

    public setBusy(): void {
        this.actionState = ActionState.Busy;
    }

    public setFree(): void {
        this.actionState = ActionState.Free;
    }

}