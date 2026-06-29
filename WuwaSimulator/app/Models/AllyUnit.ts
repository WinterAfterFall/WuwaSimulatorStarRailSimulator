import { Unit } from "./Unit";
import { StatsType, ElementType, WeaponType, ActionState } from "../Constants/Enum";
import { Queue } from "../Utils/queue";
import { RotationAction } from "./Combat/RotationAction";
import { CombatEvent } from "./Combat/CombatEvent/CombatEvent";

/** Structural type — หลีกเลี่ยง circular import กับ CombatTimeline */
export type TimelineRef = {
    schedule(event: CombatEvent): void;
    readonly currentFrame: number;
};

export class AllyUnit extends Unit {

    // --- Combat State ---
    public isOnField: boolean = false               // ยืนบนสนามอยู่ไหม
    public actionState: ActionState = ActionState.Free  // ว่าง หรือ กำลัง action

    // --- Base Stats ---
    public level   : number = 90;
    public baseAtk : number = 0;
    public baseHp  : number = 0;
    public baseDef : number = 0;

    // --- Character Info ---
    public elementType    : ElementType = ElementType.None;
    public weaponType     : WeaponType  = WeaponType.None;
    public resonanceChain : number = 0; // C ตัวละครอ่ะ

    // --- Rotation Definitions ---
    /** key = ชื่อ rotation, value = factory รับ timeline แล้วคืน Queue<RotationAction> */
    public rotations: Map<string, (timeline: TimelineRef) => Queue<RotationAction>> = new Map();

    // --- Energy ---
    public energy    : number = 0;
    public maxEnergy : number = 0;

    // --- Concerto Energy ---
    public concentoEnergy    : number = 0;
    public maxConcentoEnergy : number = 0;

    // --- HP / Shield ---
    public currentHP     : number = 0;
    public currentShield : number = 0;

    // --- Buff Tracking ---
    public stacks    : Map<string, number>  = new Map();//ใช้สำหรับนับ stack ของบัพในแต่ละชื่อ
    public buffNote  : Map<string, number>  = new Map();
    public gauges    : Map<string, number>  = new Map();
    public buffCheck : Map<string, boolean> = new Map();

    // --- Damage Record ---
    public dmgRecord    : Map<string, number> = new Map();
    public maxDmgRecord : Map<string, number> = new Map();

    constructor(name: string) {
        super(name);
    }

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