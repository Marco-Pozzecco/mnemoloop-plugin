import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SequenceReviewItem } from '@/modules/review-items/SequenceReviewItem';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { FlashcardYaml, Flashcard, FlashcardSequenceSchema, CardType } from '@/schemas';
import {
	EventBus,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardWriterFmRequestEvent,
} from '@/modules/events';
import { createSequence } from '../../../helpers/factories';
import { useFixedDate, restoreRealTimers } from '../../../helpers/date-fixtures';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

new FlashcardParserParseRequestEvent({ filepath: '' });

function createMockEngine(): IReviewEngine<FlashcardYaml> {
	return {
		sort: vi.fn((list) => list),
		calculate: vi.fn((item, _score) => ({ ...item, reps: (item.reps || 0) + 1 })),
	};
}

describe('SequenceReviewItem', () => {
	beforeEach(() => {
		useFixedDate();
		resetSingletons();
	});

	afterEach(() => {
		restoreRealTimers();
	});

	describe('construction', () => {
		it('should publish FlashcardParserParseRequestEvent on construction', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe(FlashcardParserParseRequestEvent, async (e) => {
				capturedEvents.push(e);
			});

			const engine = createMockEngine();
			new SequenceReviewItem('test.md', engine);

			const parseRequest = capturedEvents.find((e) =>
				e.isType(FlashcardParserParseRequestEvent.type),
			);
			expect(parseRequest).toBeDefined();
			expect((parseRequest as unknown as { data: { filepath: string } }).data.filepath).toBe(
				'test.md',
			);
		});

		it('should receive data from parse response', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			expect(item.data).toEqual(sequence);
		});

		it('should have steps populated after parse response', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			expect(item.data).not.toBeNull();
			expect((item.data as FlashcardSequenceSchema).content.steps).toBeDefined();
			expect((item.data as FlashcardSequenceSchema).content.steps).toEqual(['step one', 'step two', 'step three']);
		});

		it('should ignore parse responses for different filepaths', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'other.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			expect(item.data).toBeNull();
		});
	});

	describe('review', () => {
		it('should throw when data is null', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			expect(() => item.review(3)).toThrow('Review item not initialized');
		});

		it('should map score 3 to Rating.Good (3) in engine calculate', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			item.review(3);

			expect(engine.calculate).toHaveBeenCalledWith(
				expect.objectContaining({ content: expect.objectContaining({ steps: ['step one', 'step two', 'step three'] }) }),
				3,
			);
		});

		it('should map non-3 scores to Rating.Again (1) in engine calculate', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			item.review(1);

			expect(engine.calculate).toHaveBeenCalledWith(
				expect.objectContaining({ content: expect.objectContaining({ steps: ['step one', 'step two', 'step three'] }) }),
				1,
			);
		});

		it('should map score 2 to Rating.Again (1)', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			item.review(2);

			expect(engine.calculate).toHaveBeenCalledWith(
				expect.objectContaining({ content: expect.objectContaining({ steps: ['step one', 'step two', 'step three'] }) }),
				1,
			);
		});

		it('should map score 4 to Rating.Again (1)', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			item.review(4);

			expect(engine.calculate).toHaveBeenCalledWith(
				expect.objectContaining({ content: expect.objectContaining({ steps: ['step one', 'step two', 'step three'] }) }),
				1,
			);
		});

		it('should publish FlashcardReviewSessionScoreEvent with score', () => {
			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe(FlashcardReviewSessionScoreEvent, async (e) => {
				capturedEvents.push(e);
			});

			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			item.review(3);

			const scoreEvent = capturedEvents.find((e) =>
				e.isType(FlashcardReviewSessionScoreEvent.type),
			);
			expect(scoreEvent).toBeDefined();
			expect(
				(scoreEvent as unknown as { data: { rating: number; filepath: string } }).data.rating,
			).toBe(3);
			expect(
				(scoreEvent as unknown as { data: { rating: number; filepath: string } }).data.filepath,
			).toBe('test.md');
		});
	});

	describe('restore', () => {
		it('should update data fields and publish FlashcardWriterFmRequestEvent', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const sequence = createSequence({
				due: '2026-01-01T00:00:00.000Z',
				stability: 1.0,
				difficulty: 0.5,
			});
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe(FlashcardWriterFmRequestEvent, async (e) => {
				capturedEvents.push(e);
			});

			item.restore('2026-06-01T00:00:00.000Z', 2.0, 1.5);

			expect(item.data?.due).toBe('2026-06-01T00:00:00.000Z');
			expect(item.data?.stability).toBe(2.0);
			expect(item.data?.difficulty).toBe(1.5);

			const writeEvent = capturedEvents.find((e) =>
				e.isType(FlashcardWriterFmRequestEvent.type),
			);
			expect(writeEvent).toBeDefined();
		});

		it('should not publish when data is null', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			const capturedEvents: IEvent[] = [];
			EventBus.instance.subscribe(FlashcardWriterFmRequestEvent, async (e) => {
				capturedEvents.push(e);
			});

			item.restore('2026-06-01T00:00:00.000Z', 2.0, 1.5);

			expect(capturedEvents).toHaveLength(0);
		});
	});

	describe('dispose', () => {
		it('should unsubscribe from parse responses', () => {
			const engine = createMockEngine();
			const item = new SequenceReviewItem('test.md', engine);

			item.dispose();

			const sequence = createSequence();
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: sequence, filepath: 'test.md', stats: { created_at: '', updated_at: '' }, success: true }),
			);

			expect(item.data).toBeNull();
		});
	});
});
