import { Queue } from '../../../Utils/queue';

describe('Queue', () => {
    let queue: Queue<number>;

    beforeEach(() => {
        queue = new Queue<number>();
    });

    describe('enqueue and dequeue', () => {
        it('should enqueue a single element', () => {
            queue.enqueue(1);
            expect(queue.length).toBe(1);
        });

        it('should enqueue multiple elements', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            expect(queue.length).toBe(3);
        });

        it('should dequeue elements in FIFO order', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            expect(queue.dequeue()).toBe(1);
            expect(queue.dequeue()).toBe(2);
            expect(queue.dequeue()).toBe(3);
        });

        it('should return undefined when dequeue from empty queue', () => {
            expect(queue.dequeue()).toBeUndefined();
        });

        it('should decrease length after dequeue', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            expect(queue.length).toBe(2);

            queue.dequeue();
            expect(queue.length).toBe(1);

            queue.dequeue();
            expect(queue.length).toBe(0);
        });
    });

    describe('peek', () => {
        it('should return front element without removing it', () => {
            queue.enqueue(1);
            queue.enqueue(2);

            expect(queue.peek()).toBe(1);
            expect(queue.length).toBe(2);
            expect(queue.peek()).toBe(1);
        });

        it('should return undefined when queue is empty', () => {
            expect(queue.peek()).toBeUndefined();
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty queue', () => {
            expect(queue.isEmpty()).toBe(true);
        });

        it('should return false when queue has elements', () => {
            queue.enqueue(1);
            expect(queue.isEmpty()).toBe(false);
        });

        it('should return true after dequeuing all elements', () => {
            queue.enqueue(1);
            queue.enqueue(2);

            queue.dequeue();
            queue.dequeue();

            expect(queue.isEmpty()).toBe(true);
        });
    });

    describe('clear', () => {
        it('should remove all elements', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            queue.clear();

            expect(queue.length).toBe(0);
            expect(queue.isEmpty()).toBe(true);
        });

        it('should allow enqueue after clear', () => {
            queue.enqueue(1);
            queue.clear();
            queue.enqueue(2);
            expect(queue.peek()).toBe(2);
        });
    });
});
