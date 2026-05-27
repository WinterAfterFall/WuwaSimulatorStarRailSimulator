import { PQ } from '../../../Utils/priorityQueue';

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
    });
});
