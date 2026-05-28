import { IndexedPriorityQueue } from '../../Utils/IndexedPriorityQueue';

describe('IndexedPriorityQueue', () => {
    let pq: IndexedPriorityQueue<number>;

    beforeEach(() => {
        pq = new IndexedPriorityQueue<number>((a, b) => a - b); // Min-heap
    });

    describe('push', () => {
        it('should push a single element', () => {
            pq.push(5, 'five');
            expect(pq.size).toBe(1);
            expect(pq.peek()).toBe(5);
        });

        it('should push multiple elements and maintain heap order', () => {
            pq.push(3, 'three');
            pq.push(1, 'one');
            pq.push(2, 'two');
            expect(pq.size).toBe(3);
            expect(pq.peek()).toBe(1);
        });

        it('should throw on duplicate names', () => {
            pq.push(5, 'five');
            expect(() => pq.push(10, 'five')).toThrow('Conflict: Name "five" already exists');
        });
    });

    describe('pop', () => {
        it('should return undefined on empty queue', () => {
            expect(pq.pop()).toBeUndefined();
        });

        it('should pop elements in priority order', () => {
            pq.push(5, 'five');
            pq.push(3, 'three');
            pq.push(7, 'seven');
            pq.push(1, 'one');

            expect(pq.pop()).toBe(1);
            expect(pq.pop()).toBe(3);
            expect(pq.pop()).toBe(5);
            expect(pq.pop()).toBe(7);
            expect(pq.pop()).toBeUndefined();
        });

        it('should decrease size after pop', () => {
            pq.push(5, 'five');
            pq.push(3, 'three');
            expect(pq.size).toBe(2);
            pq.pop();
            expect(pq.size).toBe(1);
        });
    });

    describe('peek', () => {
        it('should return undefined on empty queue', () => {
            expect(pq.peek()).toBeUndefined();
        });

        it('should return top element without removing it', () => {
            pq.push(5, 'five');
            expect(pq.peek()).toBe(5);
            expect(pq.size).toBe(1);
            expect(pq.peek()).toBe(5);
        });
    });

    describe('update', () => {
        it('should update element with lower priority (bubble up)', () => {
            pq.push(10, 'ten');
            pq.push(5, 'five');
            pq.update('ten', 1);
            expect(pq.peek()).toBe(1);
        });

        it('should update element with higher priority (bubble down)', () => {
            pq.push(1, 'one');
            pq.push(5, 'five');
            pq.push(10, 'ten');
            pq.update('one', 8);
            expect(pq.pop()).toBe(5);
        });

        it('should skip re-bubbling when priority unchanged', () => {
            pq.push(5, 'five');
            const result = pq.update('five', 5);
            expect(result).toBe(true);
            expect(pq.peek()).toBe(5);
        });

        it('should throw when updating non-existent name', () => {
            pq.push(5, 'five');
            expect(() => pq.update('nonexistent', 1)).toThrow('Update failed: Name "nonexistent" not found');
        });

        it('should return true on successful update', () => {
            pq.push(5, 'five');
            expect(pq.update('five', 3)).toBe(true);
        });
    });

    describe('delete', () => {
        it('should delete element by name', () => {
            pq.push(5, 'five');
            pq.push(3, 'three');
            pq.push(7, 'seven');

            expect(pq.delete('three')).toBe(true);
            expect(pq.size).toBe(2);
            expect(pq.has('three')).toBe(false);
        });

        it('should return false when deleting non-existent name', () => {
            pq.push(5, 'five');
            expect(pq.delete('nonexistent')).toBe(false);
        });

        it('should maintain heap order after delete', () => {
            pq.push(1, 'one');
            pq.push(5, 'five');
            pq.push(3, 'three');
            pq.push(7, 'seven');

            pq.delete('five');

            expect(pq.pop()).toBe(1);
            expect(pq.pop()).toBe(3);
            expect(pq.pop()).toBe(7);
        });

        it('should handle deleting the last element', () => {
            pq.push(5, 'five');
            expect(pq.delete('five')).toBe(true);
            expect(pq.isEmpty).toBe(true);
        });
    });

    describe('getByName', () => {
        it('should retrieve data by name', () => {
            pq.push(42, 'answer');
            expect(pq.getByName('answer')).toBe(42);
        });

        it('should return undefined for non-existent name', () => {
            pq.push(5, 'five');
            expect(pq.getByName('nonexistent')).toBeUndefined();
        });
    });

    describe('has', () => {
        it('should return true for existing name', () => {
            pq.push(5, 'five');
            expect(pq.has('five')).toBe(true);
        });

        it('should return false for non-existent name', () => {
            expect(pq.has('five')).toBe(false);
        });

        it('should return false after deletion', () => {
            pq.push(5, 'five');
            pq.delete('five');
            expect(pq.has('five')).toBe(false);
        });
    });

    describe('size and isEmpty', () => {
        it('should report correct size', () => {
            expect(pq.size).toBe(0);
            pq.push(1, 'one');
            expect(pq.size).toBe(1);
            pq.push(2, 'two');
            expect(pq.size).toBe(2);
        });

        it('isEmpty should return true for empty queue', () => {
            expect(pq.isEmpty).toBe(true);
        });

        it('isEmpty should return false when queue has elements', () => {
            pq.push(1, 'one');
            expect(pq.isEmpty).toBe(false);
        });
    });

    describe('complex operations', () => {
        it('should handle mixed push, pop, update, delete operations', () => {
            pq.push(5, 'five');
            pq.push(3, 'three');
            pq.push(7, 'seven');
            pq.push(1, 'one');

            pq.update('five', 2);
            expect(pq.pop()).toBe(1);

            pq.delete('seven');
            expect(pq.pop()).toBe(2);

            pq.push(10, 'ten');
            pq.update('ten', 4);

            expect(pq.pop()).toBe(3);
            expect(pq.pop()).toBe(4);
            expect(pq.isEmpty).toBe(true);
        });

        it('should work with custom comparator (max-heap)', () => {
            const maxPq = new IndexedPriorityQueue<number>((a, b) => b - a); // Max-heap
            maxPq.push(3, 'three');
            maxPq.push(7, 'seven');
            maxPq.push(1, 'one');

            expect(maxPq.pop()).toBe(7);
            expect(maxPq.pop()).toBe(3);
            expect(maxPq.pop()).toBe(1);
        });

        it('should work with custom objects', () => {
            type Task = { id: number; priority: number };
            const taskPq = new IndexedPriorityQueue<Task>(
                (a, b) => a.priority - b.priority
            );

            taskPq.push({ id: 1, priority: 10 }, 'task1');
            taskPq.push({ id: 2, priority: 5 }, 'task2');
            taskPq.push({ id: 3, priority: 15 }, 'task3');

            expect(taskPq.pop()?.id).toBe(2);
            expect(taskPq.pop()?.id).toBe(1);
            expect(taskPq.pop()?.id).toBe(3);
        });
    });
});
