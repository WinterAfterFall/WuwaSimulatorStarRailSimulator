/**
 * Indexed Priority Queue
 * T: ประเภทข้อมูลที่จัดเก็บ
 */
export class IndexedPriorityQueue<T> {
    // โครงสร้างภายในเก็บ Data คู่กับ Name
    private heap: { data: T; name: string }[] = [];
    // Map สำหรับ lookup ตำแหน่งจากชื่อ: name -> index
    private positionMap: Map<string, number> = new Map();

    /**
     * @param compare ฟังก์ชันสำหรับเปรียบเทียบข้อมูล (Custom Comparator)
     * คืนค่าลบหาก a สำคัญกว่า b (Min-Heap Style)
     */
    constructor(private compare: (a: T, b: T) => number) {}

    /**
     * เพิ่มข้อมูลเข้าคิว
     * @param data ข้อมูลที่ต้องการเก็บ
     * @param name ชื่อที่ใช้ระบุตัวตน (ต้องไม่ซ้ำ)
     */
    public push(data: T, name: string): void {
        if (this.positionMap.has(name)) {
            console.error(`Conflict: Name "${name}" already exists in the queue.`);
            return;
        }

        const node = { data, name };
        this.heap.push(node);
        const index = this.heap.length - 1;
        this.positionMap.set(name, index);
        this.bubbleUp(index);
    }

    /**
     * ดึงข้อมูลที่สำคัญที่สุดตาม Comparator ออกมา
     */
    public pop(): T | undefined {
        if (this.heap.length === 0) return undefined;

        const top = this.heap[0];
        const last = this.heap.pop()!;
        this.positionMap.delete(top.name);

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.positionMap.set(last.name, 0);
            this.bubbleDown(0);
        }

        return top.data;
    }

    /**
     * อัปเดตข้อมูลเดิมด้วยชื่อระบุตัวตน
     * @param name ชื่อของข้อมูลที่ต้องการเปลี่ยน
     * @param newData ข้อมูลชุดใหม่
     */
    public update(name: string, newData: T): void {
        const index = this.positionMap.get(name);
        if (index === undefined) return;

        const oldData = this.heap[index].data;
        this.heap[index].data = newData;

        // ถ้าข้อมูลใหม่ "ดีกว่า" (สำคัญกว่า) ให้ดีดขึ้น ถ้า "แย่กว่า" ให้กดลง
        if (this.compare(newData, oldData) < 0) {
            this.bubbleUp(index);
        } else {
            this.bubbleDown(index);
        }
    }

    public getByName(name: string): T | undefined {
        const index = this.positionMap.get(name);
        return index !== undefined ? this.heap[index].data : undefined;
    }

    public get size(): number {
        return this.heap.length;
    }

    // --- Private Heap Logic ---

    private swap(i: number, j: number): void {
        const nodeI = this.heap[i];
        const nodeJ = this.heap[j];

        this.heap[i] = nodeJ;
        this.heap[j] = nodeI;

        // อัปเดตตำแหน่งใน Map ให้ตรงกับ Index ใหม่ใน Array
        this.positionMap.set(nodeI.name, j);
        this.positionMap.set(nodeJ.name, i);
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index].data, this.heap[parent].data) >= 0) break;
            this.swap(index, parent);
            index = parent;
        }
    }

    private bubbleDown(index: number): void {
        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < this.heap.length && this.compare(this.heap[left].data, this.heap[smallest].data) < 0) {
                smallest = left;
            }
            if (right < this.heap.length && this.compare(this.heap[right].data, this.heap[smallest].data) < 0) {
                smallest = right;
            }

            if (smallest === index) break;
            this.swap(index, smallest);
            index = smallest;
        }
    }
}