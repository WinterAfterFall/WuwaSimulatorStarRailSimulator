/**
 * Indexed Priority Queue
 * T: The type of data stored in the queue.
 *
 * Improvements over original:
 * - Added delete(name) method for removing arbitrary elements
 * - Added peek() method for inspecting top element without removal
 * - Added has(name) method for existence checks
 * - Added isEmpty getter for convenience
 * - push() now throws on duplicate names instead of silently failing
 * - update() now returns boolean and throws on unknown names
 * - update() skips re-bubbling when priority is unchanged (compare === 0)
 */
export class IndexedPriorityQueue<T> {
    // Internal data structure storing Data paired with its unique identifier (Name)
    private heap: { data: T; name: string }[] = [];
    // Map used to look up the array index by its identifier name: name -> index
    private positionMap: Map<string, number> = new Map();

    /**
     * @param compare Function used to compare data elements (Custom Comparator).
     * Should return a negative value if 'a' has higher priority than 'b' (Min-Heap Style).
     */
    constructor(private compare: (a: T, b: T) => number) {}

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Inserts new data into the queue.
     * @param data The data object to be stored.
     * @param name A unique identifier name for the data (must be unique).
     * @throws Error if the name already exists in the queue.
     */
    public push(data: T, name: string): void {
        if (this.positionMap.has(name)) {
            throw new Error(`Conflict: Name "${name}" already exists in the queue.`);
        }

        const node = { data, name };
        this.heap.push(node);
        const index = this.heap.length - 1;
        this.positionMap.set(name, index);
        this.bubbleUp(index);
    }

    /**
     * Removes and returns the highest priority element according to the Comparator.
     * @returns The highest priority data element, or undefined if the queue is empty.
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
     * Returns the highest priority element without removing it.
     * @returns The highest priority data element, or undefined if the queue is empty.
     */
    public peek(): T | undefined {
        return this.heap[0]?.data;
    }

    /**
     * Updates existing data associated with the given identifier name.
     * @param name The unique identifier of the data to change.
     * @param newData The new data values to apply.
     * @returns true if the update was applied successfully.
     * @throws Error if the name does not exist in the queue.
     */
    public update(name: string, newData: T): boolean {
        const index = this.positionMap.get(name);
        if (index === undefined) {
            throw new Error(`Update failed: Name "${name}" not found in queue.`);
        }

        const oldData = this.heap[index].data;
        this.heap[index].data = newData;

        const cmp = this.compare(newData, oldData);

        // Skip re-bubbling entirely if priority is unchanged
        if (cmp === 0) return true;

        // If the new data has higher priority ("better"), bubble it up. Otherwise, bubble it down.
        if (cmp < 0) {
            this.bubbleUp(index);
        } else {
            this.bubbleDown(index);
        }

        return true;
    }

    /**
     * Removes the element associated with the given identifier name from anywhere in the queue.
     * @param name The unique identifier of the data to remove.
     * @returns true if the element was found and removed, false if not found.
     */
    public delete(name: string): boolean {
        const index = this.positionMap.get(name);
        if (index === undefined) return false;

        const last = this.heap.pop()!;
        this.positionMap.delete(name);

        // If the deleted element was the last one, we're done
        if (index >= this.heap.length) return true;

        const oldData = this.heap[index].data;
        this.heap[index] = last;
        this.positionMap.set(last.name, index);

        const cmp = this.compare(last.data, oldData);

        if (cmp < 0) {
            this.bubbleUp(index);
        } else if (cmp > 0) {
            this.bubbleDown(index);
        }

        return true;
    }

    /**
     * Retrieves data by its identifier name without removing it from the queue.
     * @param name The unique identifier name.
     * @returns The associated data, or undefined if not found.
     */
    public getByName(name: string): T | undefined {
        const index = this.positionMap.get(name);
        return index !== undefined ? this.heap[index].data : undefined;
    }

    /**
     * Checks whether an element with the given identifier name exists in the queue.
     * @param name The unique identifier name.
     * @returns true if the name exists, false otherwise.
     */
    public has(name: string): boolean {
        return this.positionMap.has(name);
    }

    /**
     * Returns the total number of elements currently in the queue.
     */
    public get size(): number {
        return this.heap.length;
    }

    /**
     * Returns true if the queue has no elements.
     */
    public get isEmpty(): boolean {
        return this.heap.length === 0;
    }

    // ─────────────────────────────────────────────
    // Private Heap Logic
    // ─────────────────────────────────────────────

    /**
     * Swaps two elements in the heap array and updates their index tracking in the positionMap.
     */
    private swap(i: number, j: number): void {
        const nodeI = this.heap[i];
        const nodeJ = this.heap[j];

        this.heap[i] = nodeJ;
        this.heap[j] = nodeI;

        // Update map positions to match the new indices in the array
        this.positionMap.set(nodeI.name, j);
        this.positionMap.set(nodeJ.name, i);
    }

    /**
     * Restores heap properties by moving an element up the tree.
     */
    private bubbleUp(index: number): void {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index].data, this.heap[parent].data) >= 0) break;
            this.swap(index, parent);
            index = parent;
        }
    }

    /**
     * Restores heap properties by moving an element down the tree.
     */
    private bubbleDown(index: number): void {
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
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