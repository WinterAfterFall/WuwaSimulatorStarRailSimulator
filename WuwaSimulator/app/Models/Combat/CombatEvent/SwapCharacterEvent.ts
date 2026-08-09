import { CombatEvent } from "./CombatEvent";

/** ชื่อ event ตอนสลับตัวปกติ */
const NAME = "SwapCharacter";

/** ชื่อ event ตอนแวะเข้ามาแล้วออก */
const TEMP_NAME = "TempSwapCharacter";

/**
 * SwapCharacterEvent — event การสลับตัวละครที่ยืนอยู่บนสนาม
 *
 * เพิ่มจาก CombatEvent ปกติแค่ `isTempSwap` ตัวเดียว
 */
export class SwapCharacterEvent extends CombatEvent {
    /**
     * การสลับครั้งนี้เป็นการ "แวะเข้ามาแล้วออก" หรือเปล่า — 1 = ใช่, 0 = สลับปกติ
     *
     * ตัวละครหลายตัวมีแพทเทิร์นเข้ามากดสกิลทิ้งบัพไว้แล้วสลับออกทันที เช่น
     *   A ยืนอยู่ → swap เข้า B (`1`) → B กดสกิล → swap กลับไป A (`0`)
     * ธงจะติดอยู่กับ **ขาเข้าของตัวที่แวะ** เท่านั้น ส่วนขาที่สลับกลับถือเป็นการสลับปกติ
     */
    public readonly isTempSwap: 1 | 0;

    /**
     * ชื่อ event ถูกเลือกจาก NAME/TEMP_NAME ตาม `isTempSwap` — คนเรียกไม่ต้องส่งชื่อเข้ามา
     * ไม่ใส่ค่า = สลับปกติ (0)
     */
    constructor();
    constructor(isTempSwap: 1 | 0);
    constructor(isTempSwap: 1 | 0 = 0) {
        super(isTempSwap === 1 ? TEMP_NAME : NAME);
        this.isTempSwap = isTempSwap;

        this.execute = (battleField) => {
            // 1) ปิดคิวของตัวที่ยืนอยู่ก่อน — มันเพิ่งทำท่าของตัวเองจบถึงได้มีการสั่งสลับ
            //    ขาแวะไม่นับเป็นคิว ค่าจึงเท่าเดิม ตัวเดิมยังถูกหยิบได้อีกในรอบนี้
            const current = battleField.onFieldChar;
            if (current && this.isTempSwap !== 1) {
                current.rotationCount++;
            }

            // 2) แล้วค่อยดูว่าใครถึงคิว — ไล่จากตัวแรกสุดใน allies ตัวที่ rotationCount
            //    ยังเท่ากับของสนามคือตัวที่ยังไม่ได้ออกในรอบนี้ เจอตัวแรกที่ตรงก็หยุด
            //    (ลำดับใน allies จึงเป็นลำดับความสำคัญไปในตัว)
            if (battleField.allies.length === 0) return;

            const next = battleField.allies.find(
                ally => ally.rotationCount === battleField.rotationCount
            );

            // ─── check ─────────────────────────────────────────────────────
            // 1 rotation ตัวละครทุกตัวต้องได้ลงสนามครบพอดี แปลว่าจำนวน swap ต่อ 1 rotation
            // ต้องเท่ากับ (จำนวนตัวในทีม) เป๊ะ — rotation สั่งเอง N-1 ครั้ง + endRotation อีก 1
            //
            // หาไม่เจอ = สั่ง swap เกินโควตา (ทุกตัวออกครบไปแล้วแต่ยังมีคนสั่งอีก)
            // ให้ดังตรงนี้เลย เพราะถ้าปล่อยผ่านเงียบๆ อาการจะไปโผล่เป็น "ตัวละครไม่สลับ"
            // อีกหลายร้อย frame ถัดไป แล้วไล่ย้อนกลับมาหาต้นตอไม่เจอ
            if (!next) {
                throw new Error(
                    `${this.name}: ไม่มีตัวละครที่ถึงคิว (rotationCount === ${battleField.rotationCount}) — ` +
                    `ทีมมี ${battleField.allies.length} ตัว จึงสั่ง swap ได้ ${battleField.allies.length - 1} ครั้งต่อ 1 rotation ` +
                    `(ครั้งสุดท้ายมาจาก endRotation ให้เอง)`
                );
            }

            battleField.onFieldChar = next;
        };
    }
}
