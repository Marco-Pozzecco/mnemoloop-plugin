import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseReviewQueue } from '@/modules/review-queues/BaseReviewQueue';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';
import { Flashcard, FlashcardMetadata, FlashcardYaml, CardType } from '@/schemas';
import { createFlashcardYaml } from '../../../helpers/factories';

// Concrete subclass for testing abstract BaseReviewQueue
class TestReviewQueue extends BaseReviewQueue<Flashcard, FlashcardMetadata, FlashcardYaml> {
	add(item: IReviewItem<Flashcard>): void {
		this._items.push(item);
	}

	remove(): IReviewItem<Flashcard> | undefined {
		return this._items.pop();
	}

	get isEmpty(): boolean {
		return this._items.length === 0;
	}

	get getAll(): IReviewItem<Flashcard>[] {
		return this._items;
	}

	dispose(): void {
		this._items = [];
	}
}

function createMockEngine(): IReviewEngine<FlashcardYaml> {
	return {
		sort: vi.fn((list) => list),
		calculate: vi.fn((item) => item),
	};
}

function createMockItem(filepath: string = 'test.md'): IReviewItem<Flashcard> {
	return {
		id: `id-${filepath}`,
		data: { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard,
		review: vi.fn(),
		restore: vi.fn(),
		dispose: vi.fn(),
	};
}

describe('BaseReviewQueue', () => {
	let engine: IReviewEngine<FlashcardYaml>;

	beforeEach(() => {
		engine = createMockEngine();
	});

	describe('add', () => {
		it('should add items to the queue', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item = createMockItem('a.md');

			queue.add(item);

			expect(queue.size).toBe(1);
			expect(queue.items).toContain(item);
		});

		it('should add multiple items', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem('a.md'));
			queue.add(createMockItem('b.md'));
			queue.add(createMockItem('c.md'));

			expect(queue.size).toBe(3);
		});
	});

	describe('remove', () => {
		it('should remove the last item', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item = createMockItem('a.md');
			queue.add(item);

			const removed = queue.remove();

			expect(removed).toBe(item);
			expect(queue.size).toBe(0);
		});

		it('should return undefined when empty', () => {
			const queue = new TestReviewQueue(engine, () => true);

			expect(queue.remove()).toBeUndefined();
		});
	});

	describe('getCurrent', () => {
		it('should return first item initially', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item = createMockItem('a.md');
			queue.add(item);

			expect(queue.current).toBe(item);
		});

		it('should return undefined when empty', () => {
			const queue = new TestReviewQueue(engine, () => true);

			expect(queue.current).toBeUndefined();
		});
	});

	describe('isEmpty', () => {
		it('should be true when no items', () => {
			const queue = new TestReviewQueue(engine, () => true);

			expect(queue.isEmpty).toBe(true);
		});

		it('should be false when items exist', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem());

			expect(queue.isEmpty).toBe(false);
		});
	});

	describe('getAll', () => {
		it('should return all items', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item1 = createMockItem('a.md');
			const item2 = createMockItem('b.md');
			queue.add(item1);
			queue.add(item2);

			expect(queue.getAll).toEqual([item1, item2]);
		});
	});

	describe('next', () => {
		it('should advance to next item', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item1 = createMockItem('a.md');
			const item2 = createMockItem('b.md');
			queue.add(item1);
			queue.add(item2);

			const next = queue.next();

			expect(next).toBe(item2);
			expect(queue.position).toBe(1);
		});

		it('should return null at end of queue', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem());

			const result = queue.next();

			expect(result).toBeNull();
			expect(queue.position).toBe(1);
		});

		it('should increment position past end without clamping', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem());

			queue.next(); // position = 1, past end
			queue.next(); // position = 2, further past end

			expect(queue.current).toBeUndefined();
			expect(queue.position).toBe(2);
		});
	});

	describe('previous', () => {
		it('should go back to previous item', () => {
			const queue = new TestReviewQueue(engine, () => true);
			const item1 = createMockItem('a.md');
			const item2 = createMockItem('b.md');
			queue.add(item1);
			queue.add(item2);
			queue.next();

			const prev = queue.previous();

			expect(prev).toBe(item1);
			expect(queue.position).toBe(0);
		});

		it('should return null at start of queue', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem());

			expect(queue.previous()).toBeNull();
		});

		it('should clamp position at 0', () => {
			const queue = new TestReviewQueue(engine, () => true);
			queue.add(createMockItem());

			queue.previous();
			queue.previous();

			expect(queue.position).toBe(0);
		});
	});

	describe('position', () => {
		it('should start at 0', () => {
			const queue = new TestReviewQueue(engine, () => true);
			expect(queue.position).toBe(0);
		});
	});

	describe('size', () => {
		it('should reflect item count', () => {
			const queue = new TestReviewQueue(engine, () => true);
			expect(queue.size).toBe(0);

			queue.add(createMockItem());
			expect(queue.size).toBe(1);
		});
	});

	describe('constructor', () => {
		it('should store engine reference', () => {
			const queue = new TestReviewQueue(engine, () => true);
			expect((queue as unknown as { _engine: IReviewEngine<FlashcardYaml> })._engine).toBe(engine);
		});

		it('should store query predicate', () => {
			const predicate = (f: FlashcardMetadata) => f.decks.includes('Math');
			const queue = new TestReviewQueue(engine, predicate);

			expect(
				(queue as unknown as { _itemsQuery: (f: FlashcardMetadata) => boolean })._itemsQuery,
			).toBe(predicate);
		});
	});
});
