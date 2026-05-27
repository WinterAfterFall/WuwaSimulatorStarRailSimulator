// queue manual test
import { Queue } from "../../Utils/queue";

// สร้างฟังก์ชันช่วยเช็คค่า (แบบง่ายๆ แทน expect)
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

// --- เริ่มการรัน Logic ทดสอบ ---
console.log("--- เริ่มทดสอบ Queue ด้วย bun run ---");

const queue = new Queue<number>();

// 1. ทดสอบ Enqueue
queue.enqueue(10);
queue.enqueue(20);
assert(queue.length === 2, "ควรมีสมาชิก 2 ตัว");
assert(queue.peek() === 10, "ตัวแรกควรเป็น 10");

// 2. ทดสอบ Dequeue
const first = queue.dequeue();
assert(first === 10, "ตัวที่เอาออกควรเป็น 10");
assert(queue.length === 1, "ควรเหลือสมาชิก 1 ตัว");

// 3. ทดสอบ Empty State
queue.dequeue();
assert(queue.isEmpty() === true, "Queue ควรจะว่างเปล่า");

// 4. ทดสอบ Dequeue ค่าว่าง
const empty = queue.dequeue();
assert(empty === undefined, "Dequeue จากคิวว่างต้องได้ undefined");

// 5. ทดสอบ Generic String
const nameQueue = new Queue<string>();
nameQueue.enqueue("Bun");
assert(nameQueue.peek() === "Bun", "ควรทำงานกับ string ได้");

console.log("--- การทดสอบทั้งหมดเสร็จสิ้น ---");
