import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlashcardReviewItem } from '@/modules/review-items/FlashcardReviewItem';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { Flashcard, FlashcardYaml } from '@/schemas';
import {
	EventBus,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardWriterFmRequestEvent,
} from '@/modules/events';
import { createFlashcardYaml } from '../../../helpers/factories';
import { useFixedDate, restoreRealTimers } from '../../../helpers/date-fixtures';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

function createMockEngine(): IReviewEngine<FlashcardYaml> {
	return {
		sort: vi.fn((list) => list),
		calculate: vi.fn((item, _score) => ({ ...item, reps: (item.reps || 0) + 1 })),
	};
}

function createFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
	return {
		...createFlashcardYaml(),
		front: 'Front',
		back: 'Back',
		...overrides,
	} as Flashcard;
}

describe('FlashcardReviewItem', () => {
	beforeEach(() => {
		useFixedDate();
		resetSingletons();
	});

	afterEach(() => {
		restoreRealTimers();
	});

	describe('initialize', () => {
		it('should publish parse request on construction', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe((e) => capturedEvents.push(e));

			const engine = createMockEngine();
			new FlashcardReviewItem('test.md', engine);

			const parseRequest = capturedEvents.find((e) => e.isType(FlashcardParserParseRequestEvent.type));
			expect(parseRequest).toBeDefined();
			expect((parseRequest as unknown as { data: { filepath: string } }).data.filepath).toBe('test.md');
		});

		it('should receive data from parse response', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			// Simulate parser response
			const flashcard = createFlashcard({ front: 'Q1', back: 'A1' });
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			expect(item.data).toEqual(flashcard);
		});

		it('should ignore parse responses for different filepaths', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard = createFlashcard();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'other.md' }),
			);

			expect(item.data).toBeNull();
		});

		it('should be idempotent on multiple parse responses for same filepath', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard1 = createFlashcard({ front: 'First' });
			const flashcard2 = createFlashcard({ front: 'Second' });

			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard1, filepath: 'test.md' }),
			);
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard2, filepath: 'test.md' }),
			);

			// Last one wins
			expect(item.data).toEqual(flashcard2);
		});
	});

	describe('review', () => {
		it('should throw when data is null', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			expect(() => item.review(3)).toThrow('Review item not initialized');
		});

		it('should call engine calculate when data is set', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard = createFlashcard();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			item.review(3);

			expect(engine.calculate).toHaveBeenCalledWith(expect.anything(), 3);
		});

		it('should update data with engine result', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard = createFlashcard({ reps: 0 });
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			item.review(3);

			expect(item.data?.reps).toBe(1);
		});

		it('should publish FlashcardReviewSessionScoreEvent', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe((e) => capturedEvents.push(e));

			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard = createFlashcard({ uuid: 'uuid-123' });
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			capturedEvents.length = 0;
			item.review(4);

			const scoreEvent = capturedEvents.find((e) => e.isType(FlashcardReviewSessionScoreEvent.type));
			expect(scoreEvent).toBeDefined();
			expect((scoreEvent as unknown as { data: { rating: number } }).data.rating).toBe(4);
			expect((scoreEvent as unknown as { data: { filepath: string } }).data.filepath).toBe('test.md');
		});
	});

	describe('restore', () => {
		it('should publish FlashcardWriterFmRequestEvent', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe((e) => capturedEvents.push(e));

			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			const flashcard = createFlashcard({ due: '2026-05-18T10:00:00.000Z', stability: 2, difficulty: 3 });
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			capturedEvents.length = 0;
			item.restore('2026-01-01T00:00:00.000Z', 5.5, 4.0);

			const fmEvent = capturedEvents.find((e) => e.isType(FlashcardWriterFmRequestEvent.type));
			expect(fmEvent).toBeDefined();
			expect((fmEvent as unknown as { data: { fm: { due: string } } }).data.fm.due).toBe('2026-01-01T00:00:00.000Z');
		});

		it('should not publish event when data is null', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe((e) => capturedEvents.push(e));

			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			item.restore('2026-01-01T00:00:00.000Z', 5.5, 4.0);

			const fmEvent = capturedEvents.find((e) => e.isType(FlashcardWriterFmRequestEvent.type));
			expect(fmEvent).toBeUndefined();
		});
	});

	describe('async race condition', () => {
		it('should handle multiple items for same filepath receiving same data', () => {
			const engine = createMockEngine();
			const item1 = new FlashcardReviewItem('shared.md', engine);
			const item2 = new FlashcardReviewItem('shared.md', engine);

			const flashcard = createFlashcard({ front: 'Shared' });
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'shared.md' }),
			);

			expect(item1.data).toEqual(flashcard);
			expect(item2.data).toEqual(flashcard);
		});
	});

	describe('dispose', () => {
		it('should unsubscribe from EventBus', () => {
			const engine = createMockEngine();
			const item = new FlashcardReviewItem('test.md', engine);

			item.dispose();

			const flashcard = createFlashcard();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'test.md' }),
			);

			expect(item.data).toBeNull();
		});
	});
});
