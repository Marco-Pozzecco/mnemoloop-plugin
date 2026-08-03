import { describe, it, expect } from 'vitest';
import { computeForecastData } from '@/ui/components/elements/Chart/Flashcards/Forecast/utils';
import { CardStatus, CardType } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';
import { State } from 'ts-fsrs';

function makeFlashcard(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	const now = new Date().toISOString();
	return {
		uuid: 'test-uuid',
		file: 'test.md',
		status: CardStatus.ACTIVE,
		due: now,
		decks: [],
		stability: 1,
		difficulty: 1,
		scheduled_days: 1,
		learning_steps: 0,
		reps: 0,
		lapses: 0,
		state: State.New,
		last_review: null,
		source: null,
		card_type: CardType.Basic,
		created_at: now,
		updated_at: now,
		...overrides,
	};
}

/** Helper: find a datum by exact date key and entity */
function findEntry(
	data: { date: string; entity: string; value: number }[],
	dateKey: string,
	entity: string,
) {
	return data.find((d) => d.date === dateKey && d.entity === entity);
}

/** Return YYYY-MM-DD for today ± offset days in the local timezone */
function dayKey(offset: number): string {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + offset);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('computeWorkloadData', () => {
	it('returns (days+1)×2 entries for empty input, all with zero count', () => {
		const result = computeForecastData([]);
		// 31 days × 2 entities (flashcard + overdue)
		expect(result).toHaveLength(62);
		for (const datum of result) {
			expect(datum.value).toBe(0);
		}
	});

	it("places a single card due tomorrow in tomorrow's flashcard bucket", () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);

		const result = computeForecastData([makeFlashcard({ due: tomorrow.toISOString() })]);

		const tomorrowKey = dayKey(1);
		const entry = findEntry(result, tomorrowKey, 'flashcard');
		expect(entry).toBeDefined();
		expect(entry!.value).toBe(1);

		// No overdue cards
		const overdueEntry = findEntry(result, tomorrowKey, 'overdue');
		expect(overdueEntry!.value).toBe(0);
	});

	it("places past-due cards in today's overdue bucket", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(0, 0, 0, 0);

		const result = computeForecastData([makeFlashcard({ due: yesterday.toISOString() })]);

		const todayKey = dayKey(0);
		const overdueEntry = findEntry(result, todayKey, 'overdue');
		expect(overdueEntry).toBeDefined();
		expect(overdueEntry!.value).toBe(1);

		// Today's flashcard bucket should be 0 (card was past-due, not due today)
		const flashcardEntry = findEntry(result, todayKey, 'flashcard');
		expect(flashcardEntry!.value).toBe(0);
	});

	it('sums multiple cards due on the same date', () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		const dueISO = tomorrow.toISOString();

		const result = computeForecastData([
			makeFlashcard({ uuid: 'a', due: dueISO }),
			makeFlashcard({ uuid: 'b', due: dueISO }),
			makeFlashcard({ uuid: 'c', due: dueISO }),
		]);

		const tomorrowKey = dayKey(1);
		const entry = findEntry(result, tomorrowKey, 'flashcard');
		expect(entry).toBeDefined();
		expect(entry!.value).toBe(3);
	});

	it('excludes cards with non-ACTIVE status', () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		const dueISO = tomorrow.toISOString();

		const result = computeForecastData([
			makeFlashcard({ uuid: 'a', due: dueISO, status: CardStatus.ACTIVE }),
			makeFlashcard({ uuid: 'b', due: dueISO, status: CardStatus.DELETED }),
			makeFlashcard({ uuid: 'c', due: dueISO, status: CardStatus.PAUSED }),
			makeFlashcard({ uuid: 'd', due: dueISO, status: CardStatus.STALE }),
		]);

		const tomorrowKey = dayKey(1);
		const entry = findEntry(result, tomorrowKey, 'flashcard');
		expect(entry).toBeDefined();
		expect(entry!.value).toBe(1);
	});

	it("counts a card due today in today's flashcard bucket", () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const result = computeForecastData([makeFlashcard({ due: today.toISOString() })]);

		const todayKey = dayKey(0);
		const flashcardEntry = findEntry(result, todayKey, 'flashcard');
		expect(flashcardEntry).toBeDefined();
		expect(flashcardEntry!.value).toBe(1);

		// No overdue cards
		const overdueEntry = findEntry(result, todayKey, 'overdue');
		expect(overdueEntry!.value).toBe(0);
	});

	it("puts multiple past-due cards from different dates all into today's overdue bucket", () => {
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		twoDaysAgo.setHours(0, 0, 0, 0);

		const threeDaysAgo = new Date();
		threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
		threeDaysAgo.setHours(0, 0, 0, 0);

		const result = computeForecastData([
			makeFlashcard({ uuid: 'a', due: twoDaysAgo.toISOString() }),
			makeFlashcard({ uuid: 'b', due: threeDaysAgo.toISOString() }),
		]);

		const todayKey = dayKey(0);
		const overdueEntry = findEntry(result, todayKey, 'overdue');
		expect(overdueEntry).toBeDefined();
		expect(overdueEntry!.value).toBe(2);
	});
});
