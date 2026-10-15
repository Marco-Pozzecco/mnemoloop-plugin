import { FSRS } from 'ts-fsrs';
import type { Grade, Card } from 'ts-fsrs';

export function getIntervalPreview(
	fsrs: FSRS,
	card: Card,
	now: Date,
	rating: Grade,
	n: number,
): string[] {
	const intervals: string[] = [];
	let currentCard = card;
	let currentDate = now;

	for (let i = 0; i < n; i++) {
		const log = fsrs.repeat(currentCard, currentDate);
		const item = log[rating];
		const due = item.card.due;
		const diffMs = due.getTime() - currentDate.getTime();
		const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
		const diffHours = Math.round(diffMs / (1000 * 60 * 60));
		const days = item.card.scheduled_days;

		let interval: string;
		if (days > 0) {
			interval = `${days} day${days === 1 ? '' : 's'}`;
		} else if (diffHours >= 1) {
			interval = `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
		} else {
			interval = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
		}

		intervals.push(interval);
		currentCard = item.card;
		currentDate = due;
	}

	return intervals;
}
