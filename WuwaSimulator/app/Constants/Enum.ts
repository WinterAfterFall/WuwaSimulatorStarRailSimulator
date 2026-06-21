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

export enum StatsType {
    AtkP = "Atk%",       // พลังโจมตี %
    FlatAtk = "FlatAtk", // พลังโจมตี Raw
    Hp = "Hp%",   
    FlatHp = "FlatHp", 
    DefP = "Def%",       
    FlatDef = "FlatDef", 
    CR = "Crit rate",           // อัตราคริ   
    CD = "Crit Dmg",            // ความแรงคริ
    Dmg = "Dmg Bonus",
    Amp = "Amplify",
    Sp = "Special",
    DefRed = "Def Reduction",
    Respen = "Res Penetration",
    DmgRed = "Damage Reduction",
    ElemRed = "Elemental Reduction",
}

export enum ActionType {
    None = "None",
    BA = "BA",       // Basic Attack
    HA = "HA",       // Heavy Attack
    Skill = "Skill", // Resonance Skill
    Ult = "Ult",     // Resonance Liberation
    Echo = "Echo",   // Echo Skill
    Intro = "Intro", // Intro Skill
    Outro = "Outro", // Outro Skill
    TB = "Tune Break"        // Tune Break (หรือปุ่มหลบ)
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
    None = "0",      
    Contact = "1",      
    Midrange = "2",   
    Ranged = "3",    
    Global = "999"
}