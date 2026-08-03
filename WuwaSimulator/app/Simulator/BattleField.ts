import { AllyUnit } from "../Models/AllyUnit";
import { EnemyUnit } from "../Models/EnemyUnit";

// battleField — global เดียวที่ทุกไฟล์ import แล้วเข้าถึงชุดเดียวกันได้เสมอ (ES module เป็น singleton อยู่แล้ว)
// เก็บ ally/enemy ทั้งหมดในสนามตอนนี้ — CombatTimeline ผูกกับตัวนี้โดยตรง, Damage ก็อ่านจากตัวนี้แทนที่จะต้องรับ enemies list มาเอง
export const battleField: {
    allies : AllyUnit[];
    enemies: EnemyUnit[];
} = {
    allies : [],
    enemies: [],
};

// createEnemy — สร้าง EnemyUnit ด้วย stats พื้นฐาน (level/position default อยู่แล้วใน EnemyUnit) แล้วยัดเข้า battleField.enemies ให้เลย
export function createEnemy(name: string): EnemyUnit {
    const enemy = new EnemyUnit(name);
    battleField.enemies.push(enemy);
    return enemy;
}

// resetAllUnits — เรียกก่อนเริ่ม simulate รอบใหม่ทุกครั้ง วน unit ทุกตัวใน battleField (ทั้ง allies/enemies)
// แล้วสั่ง initDefaultStats() ให้ stats ของแต่ละตัวกลับไปเป็นค่า default ก่อนเริ่มรอบถัดไป
export function resetAllUnits(): void {
    for (const unit of [...battleField.allies, ...battleField.enemies]) {
        unit.initDefaultStats();
    }
}
