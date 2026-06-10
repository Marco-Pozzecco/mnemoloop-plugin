import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FsrsEngine } from '@/modules/review-engines/FsrsEngine';
import { createFlashcardYaml } from '../../../helpers/factories';
import { useFixedDate, restoreRealTimers } from '../../../helpers/date-fixtures';
import { Rating, State } from 'ts-fsrs';

describe('FsrsEngine', () => {
	beforeEach(() => {
		useFixedDate();
	});

	afterEach(() => {
		restoreRealTimers();
	});

	describe('constructor', () => {
		it('should accept custom parameters', () => {
			const engine = new FsrsEngine({ request_retention: 0.8, maximum_interval: 100 });
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const result = engine.calculate(card, Rating.Easy);

			const defaultEngine = new FsrsEngine();
			const defaultCard = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const defaultResult = defaultEngine.calculate(defaultCard, Rating.Easy);

			expect(result.scheduled_days).not.toBe(defaultResult.scheduled_days);
		});
	});

	describe('calculate', () => {
		it('should update card with Again rating', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const result = engine.calculate(card, Rating.Again);

			expect(result.due).toBeDefined();
			expect(result.stability).toBeGreaterThan(0);
			expect(result.state).toBe(State.Learning);
			expect(result.reps).toBe(1);
		});

		it('should update card with Hard rating', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const result = engine.calculate(card, Rating.Hard);

			expect(result.due).toBeDefined();
			expect(result.stability).toBeGreaterThan(0);
			expect(result.state).toBe(State.Learning);
			expect(result.reps).toBe(1);
		});

		it('should update card with Good rating', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const result = engine.calculate(card, Rating.Good);

			expect(result.due).toBeDefined();
			expect(result.stability).toBeGreaterThan(0);
			expect(result.reps).toBe(1);
		});

		it('should update card with Easy rating', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });
			const result = engine.calculate(card, Rating.Easy);

			expect(result.due).toBeDefined();
			expect(result.stability).toBeGreaterThan(0);
			expect(result.state).toBe(State.Review);
			expect(result.reps).toBe(1);
		});

		it('should produce different due dates for different ratings', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ due: new Date().toISOString(), state: State.New });

			const again = engine.calculate(card, Rating.Again);
			const hard = engine.calculate(card, Rating.Hard);
			const good = engine.calculate(card, Rating.Good);
			const easy = engine.calculate(card, Rating.Easy);

			expect(again.due).not.toBe(good.due);
			expect(hard.due).not.toBe(easy.due);
		});

		it('should preserve non-FSRS fields', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ uuid: 'test-uuid-123', source: '[[Note]]' });
			const result = engine.calculate(card, Rating.Good);

			expect(result.uuid).toBe('test-uuid-123');
			expect(result.source).toBe('[[Note]]');
		});

		it('should set last_review on first review', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml({ last_review: null, state: State.New });
			const result = engine.calculate(card, Rating.Good);

			expect(result.last_review).not.toBeNull();
		});
	});

	describe('sort', () => {
		it('should sort cards by due date ascending', () => {
			const engine = new FsrsEngine();
			const yesterday = new Date(Date.now() - 86400000).toISOString();
			const tomorrow = new Date(Date.now() + 86400000).toISOString();
			const today = new Date().toISOString();

			const cards = [
				createFlashcardYaml({ due: tomorrow, state: State.New }),
				createFlashcardYaml({ due: yesterday, state: State.New }),
				createFlashcardYaml({ due: today, state: State.New }),
			];

			const result = engine.sort(cards);

			expect(result[0].due).toBe(yesterday);
			expect(result[1].due).toBe(today);
			expect(result[2].due).toBe(tomorrow);
		});

		it('should sort by state priority when due dates are equal', () => {
			const engine = new FsrsEngine();
			const due = new Date().toISOString();

			const cards = [
				createFlashcardYaml({ due, state: State.New }),
				createFlashcardYaml({ due, state: State.Learning }),
				createFlashcardYaml({ due, state: State.Review }),
				createFlashcardYaml({ due, state: State.Relearning }),
			];

			const result = engine.sort(cards);

			expect(result[0].state).toBe(State.Learning);
			expect(result[1].state).toBe(State.Relearning);
			expect(result[2].state).toBe(State.Review);
			expect(result[3].state).toBe(State.New);
		});

		it('should mutate the array in-place', () => {
			const engine = new FsrsEngine();
			const due1 = new Date(Date.now() + 86400000).toISOString();
			const due2 = new Date(Date.now() - 86400000).toISOString();

			const cards = [
				createFlashcardYaml({ due: due1 }),
				createFlashcardYaml({ due: due2 }),
			];
			const originalRef = cards;

			engine.sort(cards);

			expect(cards).toBe(originalRef);
			expect(cards[0].due).toBe(due2);
		});

		it('should handle empty array', () => {
			const engine = new FsrsEngine();
			const result = engine.sort([]);
			expect(result).toEqual([]);
		});

		it('should handle single card', () => {
			const engine = new FsrsEngine();
			const card = createFlashcardYaml();
			const result = engine.sort([card]);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(card);
		});

		it('should sort due before future when mixed', () => {
			const engine = new FsrsEngine();
			const past = new Date(Date.now() - 86400000).toISOString();
			const future = new Date(Date.now() + 86400000).toISOString();

			const cards = [
				createFlashcardYaml({ due: future, state: State.New }),
				createFlashcardYaml({ due: past, state: State.New }),
			];

			const result = engine.sort(cards);
			expect(result[0].due).toBe(past);
		});
	});

	describe('updateParameters', () => {
		it('should update FSRS parameters', () => {
			const engine = new FsrsEngine();
			engine.updateParameters({ w: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] });
			// After updating parameters, calculate should still work
			const card = createFlashcardYaml();
			const result = engine.calculate(card, Rating.Good);
			expect(result.due).toBeDefined();
		});
	});
});
