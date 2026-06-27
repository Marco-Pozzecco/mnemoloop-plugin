import type { FlashcardMetadata } from '@/schemas';

export interface CumulativeDay {
	date: Date;
	dateString: string;
	added: number;
	cumulative: number;
}

/**
 * Groups flashcards by created_at date, computes daily adds and running cumulative.
 * Fills gaps: if no cards were added on a day, carries forward the prior cumulative.
 * Returns sorted array from earliest creation date to today.
 * Returns empty array if input is empty.
 */
export function computeCumulativeByDay(flashcards: FlashcardMetadata[]): CumulativeDay[] {
	if (flashcards.length === 0) return [];

	// 1. Build map: dateString → count of cards with that created_at
	const dailyCounts = new Map<string, number>();
	let earliest: Date | null = null;

	for (const card of flashcards) {
		const created = new Date(card.created_at);
		const dateString = toDateString(created);

		dailyCounts.set(dateString, (dailyCounts.get(dateString) ?? 0) + 1);

		if (!earliest || created < earliest) {
			earliest = created;
		}
	}

	// 2. Walk from earliest to today, computing running sum, filling gaps
	const today = toDateString(new Date());
	const result: CumulativeDay[] = [];
	let running = 0;
	const current = new Date(earliest!);
	current.setHours(0, 0, 0, 0);

	const end = new Date();
	end.setHours(0, 0, 0, 0);

	while (toDateString(current) <= today) {
		const ds = toDateString(current);
		const added = dailyCounts.get(ds) ?? 0;
		running += added;

		result.push({
			date: new Date(current),
			dateString: ds,
			added,
			cumulative: running,
		});

		current.setDate(current.getDate() + 1);
	}

	return result;
}

function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
