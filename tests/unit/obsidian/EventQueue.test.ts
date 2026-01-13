import { EventQueue } from '@/obsidian/EventQueue';
import { IVaultEvent, VaultEventType } from '@/obsidian/contracts/IVaultWatcher';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

describe('EventQueue', () => {
	let eventQueue: EventQueue;
	let mockProcessor: Mock<[events: IVaultEvent[]], Promise<void>>;

	beforeEach(() => {
		eventQueue = new EventQueue({ debounceTimeoutMs: 1000 });
		mockProcessor = vi.fn(async (events: IVaultEvent[]) => {
			events.forEach((event) => console.log('Processed:', event.id));
		});
		eventQueue.setProcessor(mockProcessor);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Debouncing', () => {
		it('should debounce events and process after timeout', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);

			expect(mockProcessor).not.toHaveBeenCalled();
			expect(eventQueue.getStatus().queuedCount).toBe(2);
			expect(eventQueue.getStatus().debounceActive).toBe(true);

			vi.advanceTimersByTime(1000);
			await vi.runAllTimersAsync();

			expect(mockProcessor).toHaveBeenCalledTimes(1);
			expect(mockProcessor).toHaveBeenCalledWith(expect.arrayContaining([event1, event2]));
		});

		it('should reset debounce timer on new event', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);

			vi.advanceTimersByTime(500);

			eventQueue.enqueue(event2);

			vi.advanceTimersByTime(1000);
			await vi.runAllTimersAsync();

			expect(mockProcessor).toHaveBeenCalledTimes(1);
		});
	});

	describe('Deduplication', () => {
		it('should deduplicate modify events for the same path', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test.md');
			const event3 = createMockEvent('event-3', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);
			eventQueue.enqueue(event3);

			vi.advanceTimersByTime(1000);
			await vi.runAllTimersAsync();

			expect(mockProcessor).toHaveBeenCalledTimes(1);
			const processedEvents = mockProcessor.mock.calls[0][0];
			expect(processedEvents).toHaveLength(2);
			expect(processedEvents).toEqual(expect.arrayContaining([event2, event3]));
		});

		it('should not deduplicate delete events', () => {
			const event1 = createMockEvent('event-1', VaultEventType.DELETE, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.DELETE, '/test.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);

			expect(eventQueue.getStatus().queuedCount).toBe(2);
		});

		it('should not deduplicate rename events', () => {
			const event1 = createMockEvent('event-1', VaultEventType.RENAME, '/test.md', '/old.md');
			const event2 = createMockEvent('event-2', VaultEventType.RENAME, '/test.md', '/old2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);

			expect(eventQueue.getStatus().queuedCount).toBe(2);
		});
	});

	describe('Flush', () => {
		it('should process events immediately when flushed', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);

			await eventQueue.flush();

			expect(mockProcessor).toHaveBeenCalledTimes(1);
			expect(mockProcessor).toHaveBeenCalledWith([event1, event2]);
		});

		it('should cancel debounce timer on flush', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');

			eventQueue.enqueue(event1);
			expect(eventQueue.getStatus().debounceActive).toBe(true);

			await eventQueue.flush();

			expect(eventQueue.getStatus().debounceActive).toBe(false);
		});

		it('should clear queue after flush', async () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');

			eventQueue.enqueue(event1);
			await eventQueue.flush();

			expect(eventQueue.getStatus().queuedCount).toBe(0);
		});
	});

	describe('Cancel', () => {
		it('should cancel debounce timer without processing', () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');

			eventQueue.enqueue(event1);
			eventQueue.cancel();

			expect(eventQueue.getStatus().debounceActive).toBe(false);
			expect(mockProcessor).not.toHaveBeenCalled();
		});

		it('should clear all events on cancel', () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);
			eventQueue.cancel();

			expect(eventQueue.getStatus().queuedCount).toBe(0);
		});
	});

	describe('Status', () => {
		it('should return correct status', () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');

			eventQueue.enqueue(event1);

			const status = eventQueue.getStatus();
			expect(status.queuedCount).toBe(1);
			expect(status.isProcessing).toBe(false);
			expect(status.lastEventTime).toBe(event1.timestamp);
			expect(status.debounceActive).toBe(true);
		});
	});

	describe('Clear', () => {
		it('should clear all events', () => {
			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');

			eventQueue.enqueue(event1);
			eventQueue.enqueue(event2);
			eventQueue.clear();

			expect(eventQueue.getStatus().queuedCount).toBe(0);
		});
	});

	describe('Max Queue Size', () => {
		it('should drop oldest events when queue exceeds max size', () => {
			const queue = new EventQueue({ debounceTimeoutMs: 1000, maxQueueSize: 3 });
			queue.setProcessor(mockProcessor);

			const event1 = createMockEvent('event-1', VaultEventType.MODIFY, '/test1.md');
			const event2 = createMockEvent('event-2', VaultEventType.MODIFY, '/test2.md');
			const event3 = createMockEvent('event-3', VaultEventType.MODIFY, '/test3.md');
			const event4 = createMockEvent('event-4', VaultEventType.MODIFY, '/test4.md');

			queue.enqueue(event1);
			queue.enqueue(event2);
			queue.enqueue(event3);
			queue.enqueue(event4);

			const status = queue.getStatus();
			expect(status.queuedCount).toBe(3);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when enqueueing without processor', () => {
			const queue = new EventQueue({ debounceTimeoutMs: 1000 });
			const event = createMockEvent('event-1', VaultEventType.MODIFY, '/test.md');

			expect(() => queue.enqueue(event)).toThrow('EventProcessor not set');
		});
	});
});

function createMockEvent(
	id: string,
	type: VaultEventType,
	filePath: string,
	oldPath: string | null = null,
): IVaultEvent {
	return {
		id,
		type,
		filePath,
		oldPath,
		timestamp: new Date().toISOString(),
		isMarkdown: filePath.endsWith('.md'),
	};
}
