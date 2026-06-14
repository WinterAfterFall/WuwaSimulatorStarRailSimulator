import { RotationAction } from "../Models/Combat/RotationAction";
import { Queue } from "../Utils/queue";

/**
 * RotationBuilder — สร้าง Queue<RotationAction> แบบ fluent
 * .add(name, execute) ใส่ action ต่อท้าย queue แล้ว return this ให้ chain ต่อได้
 * .build() คืน Queue<RotationAction> ที่สร้างไว้
 */
export class RotationBuilder {
    private queue = new Queue<RotationAction>();

    public add(name: string, execute: () => void): this {
        this.queue.enqueue(new RotationAction(name, execute));
        return this;
    }

    public build(): Queue<RotationAction> {
        return this.queue;
    }
}
