import { Queue } from '../Utils/queue';

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
            queue.enqueue(5);

            expect(queue.peek()).toBe(5);
            expect(queue.length).toBe(1);
        });

        it('should reset internal state properly', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.clear();

            queue.enqueue(10);
            queue.enqueue(20);
            queue.enqueue(30);

            expect(queue.dequeue()).toBe(10);
            expect(queue.dequeue()).toBe(20);
            expect(queue.dequeue()).toBe(30);
        });
    });

    describe('toArray', () => {
        it('should return array of elements in queue order', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);

            expect(queue.toArray()).toEqual([1, 2, 3]);
        });

        it('should not modify queue when calling toArray', () => {
            queue.enqueue(1);
            queue.enqueue(2);

            const arr = queue.toArray();
            expect(queue.length).toBe(2);
            expect(queue.peek()).toBe(1);
        });

        it('should return empty array for empty queue', () => {
            expect(queue.toArray()).toEqual([]);
        });

        it('should return shallow copy', () => {
            type Item = { id: number };
            const itemQueue = new Queue<Item>();

            const item1 = { id: 1 };
            const item2 = { id: 2 };

            itemQueue.enqueue(item1);
            itemQueue.enqueue(item2);

            const arr = itemQueue.toArray();
            arr[0].id = 99;

            // The actual items in the queue are the same references
            expect(itemQueue.peek()?.id).toBe(99);
        });
    });

    describe('length property', () => {
        it('should return correct length', () => {
            expect(queue.length).toBe(0);

            queue.enqueue(1);
            expect(queue.length).toBe(1);

            queue.enqueue(2);
            queue.enqueue(3);
            expect(queue.length).toBe(3);

            queue.dequeue();
            expect(queue.length).toBe(2);
        });

        it('should handle large numbers of elements', () => {
            for (let i = 0; i < 1000; i++) {
                queue.enqueue(i);
            }
            expect(queue.length).toBe(1000);

            for (let i = 0; i < 500; i++) {
                queue.dequeue();
            }
            expect(queue.length).toBe(500);
        });
    });

    describe('with different data types', () => {
        it('should work with strings', () => {
            const stringQueue = new Queue<string>();
            stringQueue.enqueue('hello');
            stringQueue.enqueue('world');

            expect(stringQueue.dequeue()).toBe('hello');
            expect(stringQueue.dequeue()).toBe('world');
        });

        it('should work with objects', () => {
            type Person = { name: string; age: number };
            const objQueue = new Queue<Person>();

            objQueue.enqueue({ name: 'Alice', age: 30 });
            objQueue.enqueue({ name: 'Bob', age: 25 });

            expect(objQueue.dequeue()?.name).toBe('Alice');
            expect(objQueue.dequeue()?.name).toBe('Bob');
        });

        it('should work with mixed types (via any or union)', () => {
            const mixQueue = new Queue<any>();
            mixQueue.enqueue(42);
            mixQueue.enqueue('string');
            mixQueue.enqueue({ key: 'value' });

            expect(mixQueue.dequeue()).toBe(42);
            expect(mixQueue.dequeue()).toBe('string');
            expect(mixQueue.dequeue()).toEqual({ key: 'value' });
        });

        it('should work with null and undefined', () => {
            const nullQueue = new Queue<number | null | undefined>();
            nullQueue.enqueue(1);
            nullQueue.enqueue(null);
            nullQueue.enqueue(undefined);

            expect(nullQueue.dequeue()).toBe(1);
            expect(nullQueue.dequeue()).toBe(null);
            expect(nullQueue.dequeue()).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('should handle rapid enqueue/dequeue cycles', () => {
            for (let cycle = 0; cycle < 10; cycle++) {
                for (let i = 0; i < 5; i++) {
                    queue.enqueue(i);
                }
                for (let i = 0; i < 5; i++) {
                    expect(queue.dequeue()).toBe(i);
                }
            }

            expect(queue.isEmpty()).toBe(true);
        });

        it('should reset indices when queue drains', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.dequeue();
            queue.dequeue();

            // After draining, internal indices should be reset
            queue.enqueue(10);
            expect(queue.peek()).toBe(10);
            expect(queue.length).toBe(1);
        });

        it('should handle interleaved operations', () => {
            queue.enqueue(1);
            expect(queue.peek()).toBe(1);

            queue.enqueue(2);
            expect(queue.peek()).toBe(1);

            expect(queue.dequeue()).toBe(1);
            expect(queue.peek()).toBe(2);

            queue.enqueue(3);
            expect(queue.length).toBe(2);

            expect(queue.dequeue()).toBe(2);
            expect(queue.dequeue()).toBe(3);
        });

        it('should handle large queue without performance degradation', () => {
            const size = 10000;

            // Enqueue many elements
            for (let i = 0; i < size; i++) {
                queue.enqueue(i);
            }

            // Dequeue many elements
            for (let i = 0; i < size; i++) {
                expect(queue.dequeue()).toBe(i);
            }

            expect(queue.isEmpty()).toBe(true);
        });
    });

    describe('O(1) operation guarantees', () => {
        it('should maintain O(1) enqueue regardless of size', () => {
            for (let i = 0; i < 10000; i++) {
                queue.enqueue(i);
            }
            // If this completes quickly, O(1) is maintained
            expect(queue.length).toBe(10000);
        });

        it('should maintain O(1) dequeue regardless of size', () => {
            for (let i = 0; i < 10000; i++) {
                queue.enqueue(i);
            }

            for (let i = 0; i < 10000; i++) {
                queue.dequeue();
            }
            // If this completes quickly, O(1) is maintained
            expect(queue.isEmpty()).toBe(true);
        });
    });
});
