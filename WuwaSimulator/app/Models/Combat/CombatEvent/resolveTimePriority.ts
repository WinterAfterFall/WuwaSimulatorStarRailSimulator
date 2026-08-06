/**
 * แยก (time?, priority?) ที่อยู่หน้า rest params ออกมา — ใช้ร่วมกันทุก CombatEvent subclass ที่รองรับ
 * 3 รูปแบบเรียก constructor: (name, ...required) / (name, time, ...required) / (name, time, priority, ...required)
 *
 * เช็คด้วย typeof เพราะ required param ตัวแรกของทุก subclass (unit/target/notifyType/damage) ไม่ใช่ number เลย
 * จึงแยกจาก time/priority ได้ชัดเจนโดยไม่ชนกัน (ต่างจากปัญหาเดิมที่เดา arg จากตำแหน่งท้ายแบบ tail-parsing)
 */
export function resolveTimePriority(args: unknown[]): { time: number; priority: number; rest: unknown[] } {
    if (typeof args[0] === "number") {
        if (typeof args[1] === "number") {
            return { time: args[0], priority: args[1], rest: args.slice(2) };
        }
        return { time: args[0], priority: 0, rest: args.slice(1) };
    }
    return { time: 0, priority: 0, rest: args };
}
