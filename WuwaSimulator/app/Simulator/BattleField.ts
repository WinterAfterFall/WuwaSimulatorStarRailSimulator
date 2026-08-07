import type { AllyUnit } from "../Models/AllyUnit";
import { EnemyUnit } from "../Models/EnemyUnit";
import { SkillRange } from "../Constants/Enum";

/**
 * BattleField — เก็บ ally/enemy ทั้งหมดในสนามตอนนี้
 * 1 instance = 1 การต่อสู้ ที่แยกขาดจากกันสมบูรณ์ (CombatTimeline เป็นเจ้าของ)
 */
export class BattleField {
    public allies : AllyUnit[]  = [];
    public enemies: EnemyUnit[] = [];

    /** สร้าง EnemyUnit (stats พื้นฐาน default อยู่แล้วใน class) แล้ว push เข้า enemies ให้เลย */
    public createEnemy(name: string): EnemyUnit {
        const enemy = new EnemyUnit(name);
        this.enemies.push(enemy);
        return enemy;
    }

    /**
     * กรอง enemies ที่อยู่ในระยะของท่า — position น้อยกว่า range ถือว่าโดน
     * SkillRange.None = "0" จึงคืน array ว่างเสมอ (ไม่มี position ไหนน้อยกว่า 0)
     */
    public enemiesInRange(range: SkillRange): EnemyUnit[] {
        return this.enemies.filter(e => Number(e.position) < Number(range));
    }

    /** เรียกก่อนเริ่ม simulate รอบใหม่ — reset stats ของทุก unit กลับค่า default */
    public resetAllUnits(): void {
        for (const unit of [...this.allies, ...this.enemies]) {
            unit.initDefaultStats();
        }
    }
}
