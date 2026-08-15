// app/Constants/Enum.ts

export enum UnitStatus {
    Alive = "Alive",
    Death = "Death"
}

export enum Side {
    None = "None",
    Ally = "Ally",
    Enemy = "Enemy"
}

// ฝั่งที่ใช้จริงอ้างอิงจาก DamageCalculate.ts — computeAttackerStats() อ่านจาก AllyUnit (attacker),
// computeTargetStats() อ่านจาก EnemyUnit (target) เท่านั้น ตอนนี้ยังไม่มี path ที่ ally โดนดาเมจ
export enum StatsType {
    AtkP = "Atk%",       // พลังโจมตี % — Ally เท่านั้น
    FlatAtk = "FlatAtk", // พลังโจมตี Raw — Ally เท่านั้น
    Hp = "Hp%",          // Ally เท่านั้น
    FlatHp = "FlatHp",   // Ally เท่านั้น
    DefP = "Def%",       // Ally เท่านั้น (DEF ของ enemy คำนวณจาก level แทน ไม่ผ่าน stat นี้)
    FlatDef = "FlatDef", // Ally เท่านั้น
    CR = "Crit rate",    // อัตราคริ — Ally เท่านั้น
    CD = "Crit Dmg",     // ความแรงคริ — Ally เท่านั้น
    Dmg = "Dmg Bonus",   // ทั้ง 2 ฝั่ง — dmgBonusMulti = 1 + attacker.dmgBonus + target.dmgBonus (รวมกันจริง เหมือน Amp)
    Amp = "Amplify",     // ทั้ง 2 ฝั่ง — ampMulti = 1 + attacker.amp + target.amp (รวมกันจริง)
    Sp = "Special",      // Ally เท่านั้น
    DefShred = "Def Ignore",        // Ally เท่านั้น — attacker ใช้ลด DEF ของ enemy
    DefRed = "Def Reduction",       // Enemy เท่านั้น — debuff บน enemy ลด DEF ตัวเองก่อนเข้าสูตร %DEF
    Res = "Res",                    // Enemy เท่านั้น — ค่าต้านทานธาตุพื้นฐานของ enemy (เช่น 0.1 = 10%) ก่อนหัก ResRed/ResPen
    ResRed = "Res Reduction",       // Enemy เท่านั้น — debuff ที่ลด Res ของ enemy ลง (ค่าบวก = ลด RES)
    ResPen = "Res Penetration",     // Ally เท่านั้น — หักลบกับ Res ของ enemy เหมือน ResRed
    DmgRed = "Damage Reduction",    // Enemy เท่านั้น
    ElemRed = "Elemental Reduction",// Enemy เท่านั้น
    TbBoost = "Tune Break Boost",   // ยังไม่ได้ต่อสายเข้า DamageCalculate.ts — เพิ่มไว้เฉยๆ
    HealBonus = "Healing Bonus",           // ฮีลที่ส่งออกเพิ่มขึ้น — Ally เท่านั้น — ยังไม่มีสมการไหนใช้ เพิ่มไว้เฉยๆ
    IncHealBonus = "Incoming Healing Bonus",// ฮีลที่ได้รับเพิ่มขึ้น — Ally เท่านั้น — ยังไม่มีสมการไหนใช้ เพิ่มไว้เฉยๆ
    EnergyRegen = "Energy Regen",          // Ally เท่านั้น — ยังไม่ต่อสายเข้า EnergyService/DamageCalculate เพิ่มไว้เฉยๆ (ใช้เก็บ Echo substat)
}

// รายชื่อ StatsType ที่แต่ละฝั่งใช้จริง (Ally เท่านั้น / Both) — ใช้ตอน initDefaultStats() ใน constructor ของ AllyUnit
export const ALLY_STATS: StatsType[] = [
    StatsType.AtkP,
    StatsType.FlatAtk,
    StatsType.Hp,
    StatsType.FlatHp,
    StatsType.DefP,
    StatsType.FlatDef,
    StatsType.CR,
    StatsType.CD,
    StatsType.Sp,
    StatsType.DefShred,
    StatsType.ResPen,
    StatsType.Dmg,
    StatsType.Amp,
];

// รายชื่อ StatsType ที่แต่ละฝั่งใช้จริง (Enemy เท่านั้น / Both) — ใช้ตอน initDefaultStats() ใน constructor ของ EnemyUnit
export const ENEMY_STATS: StatsType[] = [
    StatsType.DefRed,
    StatsType.Res,
    StatsType.ResRed,
    StatsType.DmgRed,
    StatsType.ElemRed,
    StatsType.Dmg,
    StatsType.Amp,
];

export enum ActionType {
    None = "None",
    BA = "BA",       // Basic Attack
    HA = "HA",       // Heavy Attack
    Skill = "Skill", // Resonance Skill
    Ult = "Ult",     // Resonance Liberation
    Echo = "Echo",   // Echo Skill
    Intro = "Intro", // Intro Skill
    Outro = "Outro", // Outro Skill
    TB = "Tune Break",       // Tune Break (หรือปุ่มหลบ)
    CoordAtk = "Coordinated Attack" // ดาเมจนอกสนาม — ตัวละครที่ไม่ได้ยืนอยู่ในสนามช่วยโจมตี (เช่น Camellya, Cantarella, Zani)
}

export enum ElementType {
    None = "None",
    Glacio = "Glacio",   // น้ำแข็ง
    Fusion = "Fusion",   // ไฟ
    Electro = "Electro", // ไฟฟ้า
    Aero = "Aero",       // ลม
    Spectro = "Spectro", // แสง
    Havoc = "Havoc"      // มืด
}

export enum WeaponType {
    None = "None",
    Broadblade = "Broadblade",
    Sword = "Sword",
    Pistols = "Pistols",
    Gauntlets = "Gauntlets",
    Rectifier = "Rectifier"
}

export enum ActionState {
    Free = "Free",   // unit ว่าง พร้อมรับ action ใหม่
    Busy = "Busy"    // unit กำลัง action อยู่
}

export enum NotificationType {
    ChangeToAuto  = "ChangeToAuto",   // action transition จาก manual → auto
    EndAction     = "EndAction",      // action จบสมบูรณ์
    BuffExpired   = "BuffExpired",    // buff หมดอายุ
    DebuffExpired = "DebuffExpired"   // debuff หมดอายุ
}

// เพิ่ม event ใหม่ที่นี่แล้วเพิ่ม payload คู่กันใน TriggerEventMap (Simulator/TriggerBus.ts)
export enum TriggerEvent {
    EnergyIncrease = "EnergyIncrease",  // มีการเพิ่ม energy ให้ ally คนใดคนหนึ่ง
    UltimateCast   = "UltimateCast",    // ally คนใดคนหนึ่งกด Ultimate (ActionType.Ult)
    AttackAction   = "AttackAction",    // ally คนใดคนหนึ่ง execute AttackActionEvent
    BuffAction     = "BuffAction"       // ally คนใดคนหนึ่ง execute BuffActionEvent
}

export enum EnemyPosition{
    Vanguard = "0",      
    Midrange = "1",   
    Rearguard = "2",    
    OutOfRange = "3"
}

export enum MultiplierType {
    Atk   = "atk",
    Hp    = "hp",
    Def   = "def",
    Const = "const"
}

export enum SkillRange {
    Single = "0",      
    Contact = "1",      
    Midrange = "2",   
    Ranged = "3",    
    Global = "999"
}