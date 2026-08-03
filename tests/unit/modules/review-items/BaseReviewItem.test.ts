import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseReviewItem } from '@/modules/review-items/BaseReviewItem';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { FlashcardYaml, Flashcard, CardType } from '@/schemas';
import { createFlashcardYaml } from '../../../helpers/factories';
import { useFixedDate, restoreRealTimers } from '../../../helpers/date-fixtures';

// Minimal concrete subclass for testing abstract BaseReviewItem
class TestReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	reviewCalled = false;
	reviewScore: number | null = null;
	disposeCalled = false;

	review: <Score extends number>(score: Score) => void = (score) => {
		this.reviewCalled = true;
		this.reviewScore = score;
	};

	dispose(): void {
		this.disposeCalled = true;
	}

	// Helper to set data for testing
	setData(data: Flashcard): void {
		this._data = data;
	}
}

function createMockEngine(): IReviewEngine<FlashcardYaml> {
	return {
		sort: vi.fn((list) => list),
		calculate: vi.fn((item) => item),
	};
}

describe('BaseReviewItem', () => {
	beforeEach(() => {
		useFixedDate();
	});

	afterEach(() => {
		restoreRealTimers();
	});

	describe('initialize', () => {
		it('should generate unique id from filepath', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);

			expect(item.id).toContain('test.md');
		});

		it('should store filepath and engine', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('notes/card.md', engine);

			expect((item as unknown as { _filepath: string })._filepath).toBe('notes/card.md');
			expect((item as unknown as { _engine: IReviewEngine<FlashcardYaml> })._engine).toBe(engine);
		});

		it('should generate different ids for different instances', () => {
			const engine = createMockEngine();
			const item1 = new TestReviewItem('test.md', engine);
			const item2 = new TestReviewItem('test.md', engine);

			expect(item1.id).not.toBe(item2.id);
		});
	});

	describe('review', () => {
		it('should delegate to subclass review implementation', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);

			item.review(3);

			expect(item.reviewCalled).toBe(true);
			expect(item.reviewScore).toBe(3);
		});
	});

	describe('getData', () => {
		it('should return null before data is set', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);

			expect(item.data).toBeNull();
		});

		it('should return data after it is set', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);
			const flashcard = { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard;

			item.setData(flashcard);

			expect(item.data).toBe(flashcard);
		});
	});

	describe('restore', () => {
		it('should mutate due field', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);
			const flashcard = { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard;

			item.setData(flashcard);
			item.restore('2026-01-01T00:00:00.000Z', null, null);

			expect(item.data?.due).toBe('2026-01-01T00:00:00.000Z');
		});

		it('should mutate stability field', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);
			const flashcard = { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard;

			item.setData(flashcard);
			item.restore(null, 5.5, null);

			expect(item.data?.stability).toBe(5.5);
		});

		it('should mutate difficulty field', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);
			const flashcard = { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard;

			item.setData(flashcard);
			item.restore(null, null, 3.2);

			expect(item.data?.difficulty).toBe(3.2);
		});

		it('should not throw when data is null', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);

			expect(() => item.restore('2026-01-01', 1, 1)).not.toThrow();
		});

		it('should mutate multiple fields at once', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);
			const flashcard = { ...createFlashcardYaml(), content: { meta_type: CardType.Basic, front: 'Q', back: 'A' } } as Flashcard;

			item.setData(flashcard);
			item.restore('2026-01-01T00:00:00.000Z', 5.5, 3.2);

			expect(item.data?.due).toBe('2026-01-01T00:00:00.000Z');
			expect(item.data?.stability).toBe(5.5);
			expect(item.data?.difficulty).toBe(3.2);
		});
	});

	describe('dispose', () => {
		it('should delegate to subclass dispose implementation', () => {
			const engine = createMockEngine();
			const item = new TestReviewItem('test.md', engine);

			item.dispose();

			expect(item.disposeCalled).toBe(true);
		});
	});
});
