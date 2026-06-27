import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { computeCumulativeByDay } from '@/ui/components/elements/Chart/Flashcards/Cumulative/utils';
import { createFlashcardMetadata } from '../../../../../../../helpers/factories';
import {
	useFixedDate,
	restoreRealTimers,
	FIXED_DATE,
	YESTERDAY,
} from '../../../../../../../helpers/date-fixtures';
import { CardStatus, type FlashcardMetadata } from '@/schemas';

function dateStr(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function isoAt(date: Date): string {
	return date.toISOString();
}

describe('computeCumulativeByDay', () => {
	describe('empty input', () => {
		it('returns empty array for no flashcards', () => {
			expect(computeCumulativeByDay([])).toEqual([]);
		});
	});

	describe('single card', () => {
		beforeEach(() => useFixedDate());
		afterEach(() => restoreRealTimers());

		it('produces one entry with added=1 and cumulative=1', () => {
			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: isoAt(FIXED_DATE) }),
			];

			const result = computeCumulativeByDay(cards);

			expect(result).toHaveLength(1);
			expect(result[0].dateString).toBe(dateStr(FIXED_DATE));
			expect(result[0].added).toBe(1);
			expect(result[0].cumulative).toBe(1);
		});
	});

	describe('two cards same day', () => {
		beforeEach(() => useFixedDate());
		afterEach(() => restoreRealTimers());

		it('produces one entry with added=2 and cumulative=2', () => {
			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: '2026-05-18T08:00:00.000Z' }),
				createFlashcardMetadata({ created_at: '2026-05-18T12:00:00.000Z' }),
			];

			const result = computeCumulativeByDay(cards);

			expect(result).toHaveLength(1);
			expect(result[0].dateString).toBe(dateStr(FIXED_DATE));
			expect(result[0].added).toBe(2);
			expect(result[0].cumulative).toBe(2);
		});
	});

	describe('cards on different days with gaps', () => {
		beforeEach(() => useFixedDate());
		afterEach(() => restoreRealTimers());

		it('fills gap days with cumulative carried forward', () => {
			const day1 = YESTERDAY; // 2026-05-17
			const day3 = FIXED_DATE; // 2026-05-18

			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: isoAt(day1) }),
				createFlashcardMetadata({ created_at: isoAt(day3) }),
			];

			const result = computeCumulativeByDay(cards);

			// Day 1: 2026-05-17 (1 card added)
			// Day 2: 2026-05-18 (1 card added)
			expect(result).toHaveLength(2);

			expect(result[0].dateString).toBe(dateStr(day1));
			expect(result[0].added).toBe(1);
			expect(result[0].cumulative).toBe(1);

			expect(result[1].dateString).toBe(dateStr(day3));
			expect(result[1].added).toBe(1);
			expect(result[1].cumulative).toBe(2);
		});

		it('fills gap with added=0 and carries cumulative forward', () => {
			const day1 = new Date(FIXED_DATE);
			day1.setDate(day1.getDate() - 2); // 2026-05-16
			const day3 = FIXED_DATE; // 2026-05-18
			const day2 = new Date(FIXED_DATE);
			day2.setDate(day2.getDate() - 1); // 2026-05-17

			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: isoAt(day1) }),
				createFlashcardMetadata({ created_at: isoAt(day3) }),
			];

			const result = computeCumulativeByDay(cards);

			expect(result).toHaveLength(3);

			expect(result[0].dateString).toBe(dateStr(day1));
			expect(result[0].added).toBe(1);
			expect(result[0].cumulative).toBe(1);

			// Gap day: no cards added, cumulative stays at 1
			expect(result[1].dateString).toBe(dateStr(day2));
			expect(result[1].added).toBe(0);
			expect(result[1].cumulative).toBe(1);

			expect(result[2].dateString).toBe(dateStr(day3));
			expect(result[2].added).toBe(1);
			expect(result[2].cumulative).toBe(2);
		});
	});

	describe('all card statuses counted', () => {
		beforeEach(() => useFixedDate());
		afterEach(() => restoreRealTimers());

		it('counts cards regardless of status (ACTIVE, DELETED, PAUSED, STALE)', () => {
			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: isoAt(FIXED_DATE), status: CardStatus.ACTIVE }),
				createFlashcardMetadata({ created_at: isoAt(FIXED_DATE), status: CardStatus.DELETED }),
				createFlashcardMetadata({ created_at: isoAt(FIXED_DATE), status: CardStatus.PAUSED }),
				createFlashcardMetadata({ created_at: isoAt(FIXED_DATE), status: CardStatus.STALE }),
			];

			const result = computeCumulativeByDay(cards);

			expect(result).toHaveLength(1);
			expect(result[0].added).toBe(4);
			expect(result[0].cumulative).toBe(4);
		});
	});

	describe('chronological order', () => {
		beforeEach(() => useFixedDate());
		afterEach(() => restoreRealTimers());

		it('returns dates sorted ascending', () => {
			const day1 = new Date(FIXED_DATE);
			day1.setDate(day1.getDate() - 1); // 2026-05-17
			const day2 = FIXED_DATE; // 2026-05-18

			const cards: FlashcardMetadata[] = [
				createFlashcardMetadata({ created_at: isoAt(day2) }),
				createFlashcardMetadata({ created_at: isoAt(day1) }),
			];

			const result = computeCumulativeByDay(cards);

			expect(result).toHaveLength(2);
			expect(result[0].dateString).toBe(dateStr(day1));
			expect(result[1].dateString).toBe(dateStr(day2));
			// running cumulative grows: 1 → 2
			expect(result[0].cumulative).toBe(1);
			expect(result[1].cumulative).toBe(2);
		});
	});
});
