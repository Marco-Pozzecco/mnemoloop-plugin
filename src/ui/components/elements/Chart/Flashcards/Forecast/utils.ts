import { CardStatus, type FlashcardMetadata } from '@/schemas';
import type { ForecastDatum } from './types';

/** YYYY-MM-DD in the local timezone  */
function localDateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compute day-bucketed workload data for a stacked chart.
 */
export function computeForecastData(
	flashcards: FlashcardMetadata[],
	days: number = 30,
): ForecastDatum[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayTime = today.getTime();

	const targetDate = new Date(today);
	targetDate.setDate(targetDate.getDate() + days);
	const targetTime = targetDate.getTime();

	// Pre-populate every day with both entities at zero
	// dateKey → { flashcard: number, overdue: number }
	const buckets = new Map<string, { flashcard: number; overdue: number }>();
	for (let i = 0; i <= days; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() + i);
		buckets.set(localDateKey(d), { flashcard: 0, overdue: 0 });
	}

	// Count active cards into the appropriate entity bucket
	for (const fc of flashcards) {
		if (fc.status !== CardStatus.ACTIVE) continue;

		const dueTime = new Date(fc.due).getTime();
		if (dueTime > targetTime) continue;

		// Past-due → today's date, entity 'overdue'
		const isOverdue = dueTime < todayTime;
		const key = isOverdue ? localDateKey(today) : localDateKey(new Date(dueTime));

		const dayBucket = buckets.get(key);
		if (dayBucket) {
			if (isOverdue) dayBucket.overdue += 1;
			else dayBucket.flashcard += 1;
		}
	}

	// Flatten to WorkloadDatum[], one entry per entity per day
	const result: ForecastDatum[] = [];
	for (const [date, counts] of buckets) {
		result.push({ date, entity: 'flashcard', value: counts.flashcard });
		result.push({ date, entity: 'overdue', value: counts.overdue });
	}

	return result.sort((a, b) => a.date.localeCompare(b.date) || a.entity.localeCompare(b.entity));
}
