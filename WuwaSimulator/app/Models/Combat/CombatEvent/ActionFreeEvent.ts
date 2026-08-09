import { CombatEvent } from "./CombatEvent";
import { AllyUnit } from "../../AllyUnit";
import { resolveTimePriority } from "./resolveTimePriority";

/**
 * ActionFreeEvent — ปลด unit lock ของตัวละคร (`actionState` กลับเป็น `Free`)
 *
 * คู่ตรงข้ามของ `setBusy()` ที่ `ActionEvent.execute` เรียกตอน action ออก — ตัวนี้คือขาปิด
 *
 * สร้างได้ 2 แบบ ต่างกันที่ตัว `execute` ล้วนๆ:
 *   `ActionFreeEvent.onField(name, unit)`   → setFree + ปลด GlobalLock
 *   `ActionFreeEvent.offField(name, unit)`  → setFree อย่างเดียว
 *
 * เหตุผลที่ต่างกัน: ตัวที่ยืนอยู่บนสนามเป็นคนถือ GlobalLock ไว้ (action ของมันคือ manual)
 * พอท่าจบก็ต้องคืนสิทธิ์ให้ Director สั่ง action ถัดไปได้ ส่วนท่าของตัวที่อยู่นอกสนาม
 * (เช่น `ActionType.CoordAtk`) ไม่เคยล็อกอะไรไว้ตั้งแต่แรก จึงไม่มีอะไรให้ปลด
 *
 * ชื่อ event มาจากคนเรียกล้วนๆ ไม่มีการเติมอะไรให้ — ชื่อคือ key ของ IPQ ถ้า hardcode ไว้
 * ในคลาสจะปลดได้ทีละตัวเท่านั้น (ตัวหลังที่ schedule ชื่อซ้ำจะ `update()` ทับตัวแรก
 * แล้วตัวแรกค้าง Busy ตลอดไป) คนเรียกจึงต้องเป็นคนรับผิดชอบให้ชื่อไม่ชนกันเอง
 *
 * ทั้งสองตัวรับ `time`/`priority` ของ `CombatEvent` ได้ครบ 3 รูปแบบเหมือน event อื่นในโปรเจกต์
 * (name+unit / name+time+unit / name+time+priority+unit) — `resolveTimePriority` แยกให้ด้วย
 * `typeof` ซึ่งใช้ได้เพราะ payload เป็น AllyUnit ไม่ใช่ตัวเลข จึงไม่ชนกับ time/priority
 */
export class ActionFreeEvent extends CombatEvent {
    /** ตัวละครที่จะถูกปลดล็อก */
    public readonly unit: AllyUnit;

    private constructor(name: string, time: number, priority: number, unit: AllyUnit) {
        super(name, time, priority);
        this.unit = unit;

        this.execute = (battleField) => {
            this.unit.setFree();
        };
    }

    /** ปลดตัวที่ไม่ได้อยู่บนสนาม — setFree อย่างเดียว ไม่แตะ GlobalLock */
    public static offField(name: string, unit: AllyUnit): ActionFreeEvent;
    public static offField(name: string, time: number, unit: AllyUnit): ActionFreeEvent;
    public static offField(name: string, time: number, priority: number, unit: AllyUnit): ActionFreeEvent;
    public static offField(name: string, ...args: unknown[]): ActionFreeEvent {
        return ActionFreeEvent.build(name, args);
    }

    /** ปลดตัวที่ยืนอยู่บนสนาม — setFree แล้วปลด GlobalLock ด้วย */
    public static onField(name: string, unit: AllyUnit): ActionFreeEvent;
    public static onField(name: string, time: number, unit: AllyUnit): ActionFreeEvent;
    public static onField(name: string, time: number, priority: number, unit: AllyUnit): ActionFreeEvent;
    public static onField(name: string, ...args: unknown[]): ActionFreeEvent {
        const event = ActionFreeEvent.build(name, args);

        event.execute = (battleField) => {
            event.unit.setFree();
            battleField.isGlobalLocked = false;
        };

        return event;
    }

    /** ตัวประกอบร่วมของทั้งสอง factory */
    private static build(name: string, args: unknown[]): ActionFreeEvent {
        const { time, priority, rest } = resolveTimePriority(args);
        const [unit] = rest as [AllyUnit];

        return new ActionFreeEvent(name, time, priority, unit);
    }
}
