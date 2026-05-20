/**
 * Queue
 * @template T - The type of data stored in the queue.
 *
 * A generic FIFO (First-In, First-Out) queue backed by an object map
 * for O(1) enqueue and dequeue without array shift overhead.
 *
 * @example
 * const q = new Queue<number>();
 * q.enqueue(1);
 * q.enqueue(2);
 * q.peek();    // → 1
 * q.dequeue(); // → 1
 * q.length;    // → 1
 */
export class Queue<T> {
    private items: { [key: number]: T } = {};
    private head = 0;
    private tail = 0;

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Adds an item to the back of the queue.
     * Time complexity: O(1)
     */
    enqueue(item: T): void {
        this.items[this.tail] = item;
        this.tail++;
    }

    /**
     * Removes and returns the item at the front of the queue.
     * @returns The front item, or undefined if the queue is empty.
     * Time complexity: O(1)
     */
    dequeue(): T | undefined {
        if (this.isEmpty()) return undefined;

        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;

        // Reset indices when queue drains to prevent unbounded key growth
        if (this.head === this.tail) {
            this.head = 0;
            this.tail = 0;
        }

        return item;
    }

    /**
     * Returns the front item WITHOUT removing it.
     * @returns The front item, or undefined if the queue is empty.
     * Time complexity: O(1)
     */
    peek(): T | undefined {
        return this.items[this.head];
    }

    /**
     * Returns true if the queue contains no elements.
     * Time complexity: O(1)
     */
    isEmpty(): boolean {
        return this.head === this.tail;
    }

    /**
     * Removes all elements from the queue and resets internal state.
     * Time complexity: O(1)
     */
    clear(): void {
        this.items = {};
        this.head = 0;
        this.tail = 0;
    }

    /**
     * Returns a shallow copy of all elements in queue order (front → back).
     * Does NOT modify the queue.
     * Time complexity: O(n)
     */
    toArray(): T[] {
        const result: T[] = [];
        for (let i = this.head; i < this.tail; i++) {
            result.push(this.items[i]);
        }
        return result;
    }

    /**
     * Returns the number of elements currently in the queue.
     * Time complexity: O(1)
     */
    get length(): number {
        return this.tail - this.head;
    }
}