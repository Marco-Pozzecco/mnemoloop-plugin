import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
} from '@/modules/events';
import { Flashcard, FlashcardMetadata } from '@/schemas';
import { createFlashcardMetadata } from '../../../helpers/factories';
import { useFixedDate, restoreRealTimers } from '../../../helpers/date-fixtures';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { State } from 'ts-fsrs';

// Initialize static type properties on event classes before tests
new FlashcardIndexQueryRequestEvent({ predicate: () => true });
new FlashcardIndexQueryResponseEvent([]);
new FlashcardParserParseRequestEvent({ filepath: '' });
new FlashcardParserParseResponseEvent({ entity: {} as Flashcard, filepath: '' });
describe('FlashcardReviewQueue', () => {
	let mockFlashcards: FlashcardMetadata[];
	let indexerHandler: (() => void) | undefined;
	let parserHandler: (() => void) | undefined;

	beforeEach(() => {
		useFixedDate();
		resetSingletons();

		// Set up mock indexer that responds to query requests
		indexerHandler = EventBus.instance.subscribe(FlashcardIndexQueryRequestEvent, (event) => {
			const req = event as unknown as {
				data: { predicate: (f: FlashcardMetadata) => boolean };
			};
			const { predicate } = req.data;
			const filtered = mockFlashcards.filter((f) => predicate(f));
			EventBus.instance.publish(new FlashcardIndexQueryResponseEvent(filtered));
		});

		// Set up mock parser that responds to parse requests
		parserHandler = EventBus.instance.subscribe(FlashcardParserParseRequestEvent, (event) => {
			const filepath = event.data.filepath;
			const meta = mockFlashcards.find((f) => f.file === filepath);
			const flashcard = {
				...createFlashcardMetadata(),
				...meta,
				front: 'Front',
				back: 'Back',
			} as Flashcard;
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath }),
			);
		});

		mockFlashcards = [];
	});

	afterEach(() => {
		indexerHandler?.();
		parserHandler?.();
		restoreRealTimers();
	});

	describe('build', () => {
		it('should create queue with cards from indexer', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'card1.md' }),
				createFlashcardMetadata({ file: 'card2.md' }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);

			expect(queue.size).toBe(2);
			expect(queue.items[0].data).not.toBeNull();
			expect(queue.items[1].data).not.toBeNull();
		});

		it('should apply predicate filter', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'active.md', status: 'ACTIVE' as never }),
				createFlashcardMetadata({ file: 'paused.md', status: 'PAUSED' as never }),
			];

			const queue = new FlashcardReviewQueue((f) => f.status === 'ACTIVE', undefined);

			expect(queue.size).toBe(1);
			expect(queue.items[0].data?.status).toBe('ACTIVE');
		});

		it('should apply deck filter via predicate', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'math.md', decks: ['Math'] }),
				createFlashcardMetadata({ file: 'science.md', decks: ['Science'] }),
			];

			const queue = new FlashcardReviewQueue((f) => f.decks.includes('Math'), undefined);

			expect(queue.size).toBe(1);
			expect(queue.items[0].data?.decks).toContain('Math');
		});

		it('should filter due cards with predicate', () => {
			const past = new Date(Date.now() - 86400000).toISOString();
			const future = new Date(Date.now() + 86400000).toISOString();

			mockFlashcards = [
				createFlashcardMetadata({ file: 'past.md', due: past, state: State.Review }),
				createFlashcardMetadata({ file: 'future.md', due: future, state: State.Review }),
			];

			const queue = new FlashcardReviewQueue((f) => new Date(f.due).getTime() <= Date.now(), undefined);

			expect(queue.size).toBe(1);
			expect((queue.items[0].data as unknown as FlashcardMetadata)?.file).toBe('past.md');
		});

		it('should sort items by due date via engine', () => {
			const yesterday = new Date(Date.now() - 86400000).toISOString();
			const tomorrow = new Date(Date.now() + 86400000).toISOString();

			mockFlashcards = [
				createFlashcardMetadata({ file: 'tomorrow.md', due: tomorrow, state: State.Review }),
				createFlashcardMetadata({ file: 'yesterday.md', due: yesterday, state: State.Review }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);

			expect(queue.items[0].data?.due).toBe(yesterday);
			expect(queue.items[1].data?.due).toBe(tomorrow);
		});

		it('should return empty queue when no cards match', () => {
			mockFlashcards = [createFlashcardMetadata({ file: 'card.md' })];

			const queue = new FlashcardReviewQueue(() => false, undefined);

			expect(queue.size).toBe(0);
			expect(queue.current).toBeUndefined();
		});
	});

	describe('recalc', () => {
		it('should repopulate items from indexer', () => {
			mockFlashcards = [createFlashcardMetadata({ file: 'card.md' })];

			const queue = new FlashcardReviewQueue(() => true, undefined);
			expect(queue.size).toBe(1);

			// Update mock data and recalc
			mockFlashcards = [
				createFlashcardMetadata({ file: 'card1.md' }),
				createFlashcardMetadata({ file: 'card2.md' }),
			];
			queue.recalc();

			expect(queue.size).toBe(2);
		});

		it('should reset position to 0', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'a.md' }),
				createFlashcardMetadata({ file: 'b.md' }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);
			queue.next(); // Move to position 1
			expect(queue.position).toBe(1);

			queue.recalc();

			expect(queue.position).toBe(0);
		});

		it('should apply scheduling sort on recalc', () => {
			const yesterday = new Date(Date.now() - 86400000).toISOString();
			const tomorrow = new Date(Date.now() + 86400000).toISOString();

			mockFlashcards = [
				createFlashcardMetadata({ file: 'tomorrow.md', due: tomorrow, state: State.Review }),
				createFlashcardMetadata({ file: 'yesterday.md', due: yesterday, state: State.Review }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);
			queue.next(); // position = 1

			// Swap order in mock data
			mockFlashcards = [
				createFlashcardMetadata({ file: 'yesterday.md', due: yesterday, state: State.Review }),
				createFlashcardMetadata({ file: 'tomorrow.md', due: tomorrow, state: State.Review }),
			];
			queue.recalc();

			expect(queue.items[0].data?.due).toBe(yesterday);
			expect(queue.position).toBe(0);
		});
	});

	describe('dispose', () => {
		it('should dispose all items', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'a.md' }),
				createFlashcardMetadata({ file: 'b.md' }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);
			const items = [...queue.items];

			queue.dispose();

			// After dispose, items should not receive new parse responses
			const flashcard = {
				...createFlashcardMetadata(),
				front: 'Updated',
				back: 'Back',
			} as Flashcard;
			EventBus.instance.publish(
				new FlashcardParserParseResponseEvent({ entity: flashcard, filepath: 'a.md' }),
			);

			expect(items[0].data?.front).toBe('Front'); // Not updated
		});
	});

	describe('current', () => {
		it('should return first item initially', () => {
			mockFlashcards = [createFlashcardMetadata({ file: 'card.md' })];

			const queue = new FlashcardReviewQueue(() => true, undefined);

			expect(queue.current).toBeDefined();
			expect(queue.current?.data).not.toBeNull();
		});

		it('should navigate with next', () => {
			mockFlashcards = [
				createFlashcardMetadata({ file: 'a.md' }),
				createFlashcardMetadata({ file: 'b.md' }),
			];

			const queue = new FlashcardReviewQueue(() => true, undefined);
			const first = queue.current;
			const next = queue.next();

			expect(next).not.toBe(first);
			expect(queue.current).toBe(next);
		});
	});
});
