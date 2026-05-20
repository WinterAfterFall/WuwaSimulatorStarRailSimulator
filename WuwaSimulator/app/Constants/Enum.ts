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
    Sp = "Speacial",
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