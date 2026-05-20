/**
 * Priority Queue (Heap)
 *
 * A generic priority queue that works with any type T.
 * Priority order is fully controlled by a custom comparator function.
 *
 * @template T - The type of elements stored in the queue.
 *
 * @example — Min-Heap of numbers
 * const pq = new PQ<number>((a, b) => a - b);
 *
 * @example — Max-Heap of numbers
 * const pq = new PQ<number>((a, b) => b - a);
 *
 * @example — Custom object, sorted by priority field
 * type Task = { name: string; priority: number };
 * const pq = new PQ<Task>((a, b) => a.priority - b.priority);
 */
export class PQ<T> {
    private heap: T[] = [];

    /**
     * @param compare Comparator function that defines priority order.
     *
     * Return a NEGATIVE number if `a` should come BEFORE `b` (higher priority).
     * Return a POSITIVE number if `b` should come BEFORE `a`.
     * Return 0 if they have equal priority.
     *
     * Min-Heap:  (a, b) => a - b
     * Max-Heap:  (a, b) => b - a
     */
    constructor(private compare: (a: T, b: T) => number) {}

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Inserts an element into the queue.
     * Time complexity: O(log n)
     */
    public push(item: T): void {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    /**
     * Removes and returns the highest priority element.
     * @returns The highest priority element, or undefined if the queue is empty.
     * Time complexity: O(log n)
     */
    public pop(): T | undefined {
        if (this.heap.length === 0) return undefined;

        const top = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }

        return top;
    }

    /**
     * Returns the highest priority element WITHOUT removing it.
     * @returns The top element, or undefined if the queue is empty.
     * Time complexity: O(1)
     */
    public peek(): T | undefined {
        return this.heap[0];
    }

    /**
     * Removes the FIRST element that satisfies the given predicate.
     * Useful for deleting a specific item by value or property.
     *
     * @param predicate A function that returns true for the element to remove.
     * @returns true if an element was found and removed, false otherwise.
     *
     * @example — Delete task named "cleanup"
     * pq.delete(task => task.name === "cleanup");
     *
     * Time complexity: O(n) to find + O(log n) to fix heap = O(n)
     */
    public delete(predicate: (item: T) => boolean): boolean {
        const index = this.heap.findIndex(predicate);
        if (index === -1) return false;

        const last = this.heap.pop()!;

        // If the deleted item was the last element, we're done
        if (index >= this.heap.length) return true;

        const displaced = this.heap[index];
        this.heap[index] = last;

        // Restore heap: bubble up if last has higher priority, otherwise bubble down
        if (this.compare(last, displaced) < 0) {
            this.bubbleUp(index);
        } else {
            this.bubbleDown(index);
        }

        return true;
    }

    /**
     * Returns the total number of elements in the queue.
     * Time complexity: O(1)
     */
    public get size(): number {
        return this.heap.length;
    }

    /**
     * Returns true if the queue contains no elements.
     * Time complexity: O(1)
     */
    public get isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Removes all elements from the queue.
     */
    public clear(): void {
        this.heap = [];
    }

    /**
     * Returns a sorted array of all elements (highest priority first).
     * Does NOT modify the queue.
     * Time complexity: O(n log n)
     */
    public toSortedArray(): T[] {
        const clone = new PQ<T>(this.compare);
        clone.heap = [...this.heap];
        const result: T[] = [];
        while (!clone.isEmpty) {
            result.push(clone.pop()!);
        }
        return result;
    }

    // ─────────────────────────────────────────────
    // Private Heap Logic
    // ─────────────────────────────────────────────

    /**
     * Restores heap order by moving an element UP toward the root.
     */
    private bubbleUp(index: number): void {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parent]) >= 0) break;
            this.swap(index, parent);
            index = parent;
        }
    }

    /**
     * Restores heap order by moving an element DOWN toward the leaves.
     */
    private bubbleDown(index: number): void {
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let best = index;

            if (left < this.heap.length && this.compare(this.heap[left], this.heap[best]) < 0) {
                best = left;
            }
            if (right < this.heap.length && this.compare(this.heap[right], this.heap[best]) < 0) {
                best = right;
            }

            if (best === index) break;
            this.swap(index, best);
            index = best;
        }
    }

    /**
     * Swaps two elements in the heap array.
     */
    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}