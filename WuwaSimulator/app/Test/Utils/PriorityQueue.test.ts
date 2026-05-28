import { PQ } from '../Utils/PriorityQueue';

describe('PriorityQueue (PQ)', () => {
    let pq: PQ<number>;

    beforeEach(() => {
        pq = new PQ<number>((a, b) => a - b); // Min-heap
    });

    describe('push', () => {
        it('should push a single element', () => {
            pq.push(5);
            expect(pq.size).toBe(1);
            expect(pq.peek()).toBe(5);
        });

        it('should push multiple elements and maintain heap order', () => {
            pq.push(3);
            pq.push(1);
            pq.push(2);
            expect(pq.size).toBe(3);
            expect(pq.peek()).toBe(1);
        });

        it('should allow duplicate values', () => {
            pq.push(5);
            pq.push(5);
            expect(pq.size).toBe(2);
        });
    });

    describe('pop', () => {
        it('should return undefined on empty queue', () => {
            expect(pq.pop()).toBeUndefined();
        });

        it('should pop elements in priority order', () => {
            pq.push(5);
            pq.push(3);
            pq.push(7);
            pq.push(1);

            expect(pq.pop()).toBe(1);
            expect(pq.pop()).toBe(3);
            expect(pq.pop()).toBe(5);
            expect(pq.pop()).toBe(7);
            expect(pq.pop()).toBeUndefined();
        });

        it('should decrease size after pop', () => {
            pq.push(5);
            pq.push(3);
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
            pq.push(5);
            expect(pq.peek()).toBe(5);
            expect(pq.size).toBe(1);
            expect(pq.peek()).toBe(5);
        });
    });

    describe('delete', () => {
        it('should delete first matching element by predicate', () => {
            pq.push(5);
            pq.push(3);
            pq.push(7);

            expect(pq.delete((x) => x === 3)).toBe(true);
            expect(pq.size).toBe(2);
        });

        it('should return false when no element matches predicate', () => {
            pq.push(5);
            pq.push(3);
            expect(pq.delete((x) => x === 10)).toBe(false);
        });

        it('should maintain heap order after delete', () => {
            pq.push(1);
            pq.push(5);
            pq.push(3);
            pq.push(7);

            pq.delete((x) => x === 5);

            expect(pq.pop()).toBe(1);
            expect(pq.pop()).toBe(3);
            expect(pq.pop()).toBe(7);
        });

        it('should handle deleting the last element', () => {
            pq.push(5);
            expect(pq.delete((x) => x === 5)).toBe(true);
            expect(pq.isEmpty).toBe(true);
        });

        it('should delete only the first matching element', () => {
            pq.push(5);
            pq.push(5);
            pq.push(5);

            expect(pq.delete((x) => x === 5)).toBe(true);
            expect(pq.size).toBe(2);
        });
    });

    describe('size and isEmpty', () => {
        it('should report correct size', () => {
            expect(pq.size).toBe(0);
            pq.push(1);
            expect(pq.size).toBe(1);
            pq.push(2);
            expect(pq.size).toBe(2);
        });

        it('isEmpty should return true for empty queue', () => {
            expect(pq.isEmpty).toBe(true);
        });

        it('isEmpty should return false when queue has elements', () => {
            pq.push(1);
            expect(pq.isEmpty).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all elements', () => {
            pq.push(1);
            pq.push(2);
            pq.push(3);
            pq.clear();

            expect(pq.isEmpty).toBe(true);
            expect(pq.size).toBe(0);
            expect(pq.pop()).toBeUndefined();
        });

        it('should allow pushing after clear', () => {
            pq.push(1);
            pq.clear();
            pq.push(5);

            expect(pq.peek()).toBe(5);
            expect(pq.size).toBe(1);
        });
    });

    describe('toSortedArray', () => {
        it('should return sorted array without modifying queue', () => {
            pq.push(5);
            pq.push(3);
            pq.push(7);
            pq.push(1);

            const sorted = pq.toSortedArray();

            expect(sorted).toEqual([1, 3, 5, 7]);
            expect(pq.size).toBe(4);
            expect(pq.peek()).toBe(1);
        });

        it('should return empty array for empty queue', () => {
            const sorted = pq.toSortedArray();
            expect(sorted).toEqual([]);
        });

        it('should handle single element', () => {
            pq.push(42);
            const sorted = pq.toSortedArray();
            expect(sorted).toEqual([42]);
        });
    });

    describe('max-heap operations', () => {
        it('should work with max-heap comparator', () => {
            const maxPq = new PQ<number>((a, b) => b - a); // Max-heap

            maxPq.push(3);
            maxPq.push(7);
            maxPq.push(1);
            maxPq.push(5);

            expect(maxPq.pop()).toBe(7);
            expect(maxPq.pop()).toBe(5);
            expect(maxPq.pop()).toBe(3);
            expect(maxPq.pop()).toBe(1);
        });
    });

    describe('custom objects', () => {
        it('should work with custom objects', () => {
            type Task = { id: number; priority: number };
            const taskPq = new PQ<Task>((a, b) => a.priority - b.priority);

            taskPq.push({ id: 1, priority: 10 });
            taskPq.push({ id: 2, priority: 5 });
            taskPq.push({ id: 3, priority: 15 });

            expect(taskPq.pop()?.id).toBe(2);
            expect(taskPq.pop()?.id).toBe(1);
            expect(taskPq.pop()?.id).toBe(3);
        });

        it('should delete custom object by property', () => {
            type Task = { id: number; priority: number };
            const taskPq = new PQ<Task>((a, b) => a.priority - b.priority);

            taskPq.push({ id: 1, priority: 10 });
            taskPq.push({ id: 2, priority: 5 });
            taskPq.push({ id: 3, priority: 15 });

            expect(taskPq.delete((task) => task.id === 2)).toBe(true);
            expect(taskPq.size).toBe(2);

            expect(taskPq.pop()?.id).toBe(1);
            expect(taskPq.pop()?.id).toBe(3);
        });
    });

    describe('complex operations', () => {
        it('should handle mixed push, pop, delete operations', () => {
            pq.push(5);
            pq.push(3);
            pq.push(7);
            pq.push(1);

            expect(pq.pop()).toBe(1);
            pq.delete((x) => x === 7);
            expect(pq.pop()).toBe(3);

            pq.push(2);
            expect(pq.pop()).toBe(2);
            expect(pq.pop()).toBe(5);
            expect(pq.isEmpty).toBe(true);
        });

        it('should handle large numbers of elements', () => {
            const max = 1000;
            // Push in random order
            const arr = Array.from({ length: max }, (_, i) => i);
            arr.sort(() => Math.random() - 0.5);

            arr.forEach((val) => pq.push(val));

            // Pop in sorted order
            for (let i = 0; i < max; i++) {
                expect(pq.pop()).toBe(i);
            }
        });

        it('should handle strings with custom comparator', () => {
            const stringPq = new PQ<string>(
                (a, b) => a.localeCompare(b)
            );

            stringPq.push('charlie');
            stringPq.push('alice');
            stringPq.push('bob');

            expect(stringPq.pop()).toBe('alice');
            expect(stringPq.pop()).toBe('bob');
            expect(stringPq.pop()).toBe('charlie');
        });
    });
});
