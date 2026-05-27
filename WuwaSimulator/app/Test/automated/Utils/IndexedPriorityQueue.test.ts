import { IndexedPriorityQueue } from '../../../Utils/indexedPriorityQueue';

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
});
