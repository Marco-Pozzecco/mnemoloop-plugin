import { FlashcardReviewSessionEndData } from '@/modules/events/domains/flashcard/review';
import { DailyProgress, FlashcardMetadata, ReviewSession } from '@/schemas';
import { CardStatus } from '@/schemas/flashcard';

export const MAX_RECALC_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const BUFFER_MS = 300;

export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

export function createDailyProgress(): DailyProgress {
	return {
		total_count: 0,
		correct_count: 0,
		incorrect_count: 0,
		retention_rate: 0,
		sessions_completed: 0,
		total_duration: 0,
		goal_completed: false,
	};
}

export function computeFlashcardStats(
	flashcards: FlashcardMetadata[],
	now: Date,
): {
	due_now: number;
	due_today: number;
	next_review: Date | null;
	expected_review_time: number;
	total_cards: number;
} {
	const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
	const midnightTomorrow = new Date(midnightToday.getTime() + 24 * 60 * 60 * 1000);

	let due_now = 0;
	let due_today = 0;
	let next_review: Date | null = null;
	let expected_review_time = 0;

	for (const card of flashcards) {
		if (card.status !== CardStatus.ACTIVE) continue;

		const dueDate = new Date(card.due);

		if (dueDate <= now) {
			due_now++;
		}

		if (dueDate < midnightTomorrow) {
			due_today++;
		}

		if (dueDate > now && (!next_review || dueDate < next_review)) {
			next_review = dueDate;
		}

		expected_review_time += 30;
	}

	const total_cards = flashcards.filter((f) => f.status === CardStatus.ACTIVE).length;

	return {
		due_now,
		due_today,
		next_review,
		expected_review_time,
		total_cards,
	};
}

export function computeNextRecalcDelay(
	flashcards: FlashcardMetadata[],
	now: Date,
	bufferMs: number,
	maxDelayMs: number,
): number | null {
	const futureDueCards = flashcards
		.filter((f) => f.status === CardStatus.ACTIVE)
		.filter((f) => new Date(f.due) > now)
		.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

	const nextDueCard = futureDueCards[0];

	if (!nextDueCard) {
		return null;
	}

	const msUntilDue = new Date(nextDueCard.due).getTime() - now.getTime();

	if (msUntilDue > maxDelayMs) return null;

	return msUntilDue + bufferMs;
}

export function updateDailyProgressFromReview(
	progress: DailyProgress,
	rating: number,
	dailyGoal: number,
): DailyProgress {
	const newTotalCount = progress.total_count + 1;
	const newCorrectCount = progress.correct_count + (rating >= 3 ? 1 : 0);
	const newIncorrectCount = progress.incorrect_count + (rating < 3 ? 1 : 0);
	const retention_rate = newTotalCount > 0 ? newCorrectCount / newTotalCount : 0;
	const goal_completed = newTotalCount >= dailyGoal;

	return {
		...progress,
		total_count: newTotalCount,
		correct_count: newCorrectCount,
		incorrect_count: newIncorrectCount,
		retention_rate,
		goal_completed,
	};
}

export function computeAggregateRetentionRate(progress: Record<string, DailyProgress>): number {
	const allProgress = Object.values(progress);
	const totalCorrectAllTime = allProgress.reduce((sum, day) => sum + day.correct_count, 0);
	const totalReviewsAllTime = allProgress.reduce((sum, day) => sum + day.total_count, 0);

	return totalReviewsAllTime > 0 ? totalCorrectAllTime / totalReviewsAllTime : 0;
}

export function isCardLearnedToday(reviewDate: Date, dueDate: Date, today: string): boolean {
	const midnightTomorrow = new Date(today);
	midnightTomorrow.setHours(24, 0, 0, 0);

	return formatDate(reviewDate) === today && dueDate >= midnightTomorrow;
}

export function updateDifficultyDistribution(
	dist: Record<string, number>,
	difficulty: number,
): Record<string, number> {
	const difficultyKey = Math.round(difficulty).toString();

	return {
		...dist,
		[difficultyKey]: (dist[difficultyKey] || 0) + 1,
	};
}

export function calculateStreaks(
	progress: Record<string, { total_count: number }>,
	today: string,
): {
	current_streak: number;
	longest_streak: number;
} {
	const dates = Object.keys(progress).sort();

	if (dates.length === 0) {
		return { current_streak: 0, longest_streak: 0 };
	}

	let longest_streak = 0;
	let tempStreak = 0;
	let prevDate: Date | null = null;

	for (const dateStr of dates) {
		const day = progress[dateStr];
		const currentDate = new Date(dateStr);

		if (day.total_count > 0) {
			if (!prevDate) {
				tempStreak = 1;
			} else {
				const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
				if (diffDays === 1) {
					tempStreak++;
				} else {
					tempStreak = 1;
				}
			}

			longest_streak = Math.max(longest_streak, tempStreak);
			prevDate = currentDate;
		} else {
			tempStreak = 0;
		}
	}

	let current_streak = 0;
	const lastDate = dates[dates.length - 1];
	const lastActivityTotal = progress[lastDate]?.total_count || 0;

	if (lastActivityTotal > 0) {
		const daysSinceLastActivity =
			(new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);

		if (daysSinceLastActivity <= 1) {
			current_streak = tempStreak;
		}
	}

	return { current_streak, longest_streak };
}

export function createReviewSessionRecord(data: FlashcardReviewSessionEndData): ReviewSession {
	return {
		session_id: data.session_id,
		date: data.date,
		review_type: data.review_type,
		start_time: data.start_time,
		end_time: data.end_time,
		total_count: data.count,
		correct_count: data.correct_count,
		incorrect_count: data.incorrect_count,
		duration_s: data.duration,
	};
}

export function updateProgressFromSession(
	progress: DailyProgress,
	duration: number,
): DailyProgress {
	return {
		...progress,
		sessions_completed: progress.sessions_completed + 1,
		total_duration: progress.total_duration + duration,
	};
}
