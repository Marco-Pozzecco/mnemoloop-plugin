import { IEvent } from '@/interfaces/IEvent';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';

import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { AdapterKey } from '@/types/adapters';
import { ProcessorKey } from '@/types/processors';
import { EventBus } from '../core/EventBus';
import { EventProcessor } from '../core/EventProcessor';
import { EventRegistry } from '../core/EventRegistry';
import {
	FlashcardIndexCreateEvent,
	FlashcardIndexDeleteEvent,
	FlashcardIndexInitializeEvent,
	FlashcardIndexRecalcRequestEvent,
	FlashcardIndexRecalcResponseEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexUpdateEvent,
	FlashcardReviewSessionEndEvent,
	FlashcardReviewSessionScoreEvent,
	DashboardOpenEvent,
} from '../domains';
import { DailyProgress, FlashcardMetadata } from '@/schemas';

export class StatisticsProcessor extends EventProcessor {
	protected readonly eventTypes: string[] = [
		FlashcardReviewSessionScoreEvent.type,
		FlashcardReviewSessionEndEvent.type,
		FlashcardIndexCreateEvent.type,
		FlashcardIndexDeleteEvent.type,
		FlashcardIndexInitializeEvent.type,
		FlashcardIndexSaveEvent.type,
		FlashcardIndexUpdateEvent.type,
		FlashcardIndexRecalcResponseEvent.type,
		DashboardOpenEvent.type,
	];

	private _recalcTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly _statsAdapter: StatisticsAdapter;

	// Maximum delay between recalculations
	private static readonly MAX_RECALC_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
	// Buffer time after a card becomes due before recalculating
	private static readonly BUFFER_MS = 300;

	static {
		EventRegistry.instance.register(ProcessorKey.statistics, (deps: IEventRegistryDependencies) => {
			const statsAdapter = deps.adapters.get(AdapterKey.statistics);
			if (!statsAdapter) {
				throw new Error('Statistics adapter not found');
			}
			return new StatisticsProcessor(statsAdapter as StatisticsAdapter);
		});
	}

	constructor(statsAdapter: StatisticsAdapter) {
		super();
		this._statsAdapter = statsAdapter;
	}

	/**
	 * Process an event using type guards for branching to handle different event types.
	 */
	protected process(event: IEvent): void {
		if (event.isType(FlashcardReviewSessionScoreEvent.type)) {
			this._handleReviewFlashcard(event as FlashcardReviewSessionScoreEvent);
		} else if (event.isType(FlashcardReviewSessionEndEvent.type)) {
			this._handleSessionEnd(event as FlashcardReviewSessionEndEvent);
		} else if (event.isType(FlashcardIndexRecalcResponseEvent.type)) {
			this._handleRecalcResponse(event as FlashcardIndexRecalcResponseEvent);
		} else if (event.isType(DashboardOpenEvent.type)) {
			this._handleDashboardVisible();
		} else if (this._isIndexFlashcardEvent(event)) {
			this._forceRecalculation();
		}
	}

	/**
	 * Check if event is an index flashcard event.
	 */
	private _isIndexFlashcardEvent(event: IEvent): boolean {
		const indexTypes: string[] = [
			FlashcardIndexCreateEvent.type,
			FlashcardIndexDeleteEvent.type,
			FlashcardIndexUpdateEvent.type,
			FlashcardIndexInitializeEvent.type,
			FlashcardIndexSaveEvent.type,
		];
		return indexTypes.includes(event.type);
	}

	/**
	 * Handle dashboard becoming visible - force recalc to ensure fresh data.
	 */
	private _handleDashboardVisible(): void {
		this._forceRecalculation();
	}

	/**
	 * Handle recalc response events - update aggregate flashcard statistics.
	 */
	private _handleRecalcResponse(event: FlashcardIndexRecalcResponseEvent): void {
		const flashcards = event.data.flashcards;
		const now = new Date();
		const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
		const midnightTomorrow = new Date(midnightToday.getTime() + 24 * 60 * 60 * 1000);

		let dueNow = 0;
		let dueToday = 0;
		let nextReview: Date | null = null;
		let totalExpectedTime = 0;

		for (const card of flashcards) {
			if (card.status !== 'ACTIVE') continue;

			const dueDate = new Date(card.due);

			// due_now: due <= now
			if (dueDate <= now) {
				dueNow++;
			}

			// due_today: due < midnight tomorrow
			if (dueDate < midnightTomorrow) {
				dueToday++;
			}

			// Track next upcoming review
			if (dueDate > now && (!nextReview || dueDate < nextReview)) {
				nextReview = dueDate;
			}

			// Estimate review time (30 seconds per card)
			totalExpectedTime += 30;
		}

		const totalCards = flashcards.filter((f) => f.status === 'ACTIVE').length;

		this._statsAdapter.update({
			flashcard: {
				...this._statsAdapter.data.flashcard,
				total_cards: totalCards,
				due_now: dueNow,
				due_today: dueToday,
				next_review: nextReview?.toISOString() ?? new Date().toISOString(),
				expected_review_time: totalExpectedTime,
			},
			updated_at: new Date().toISOString(),
		});
		this._statsAdapter.save();

		// Schedule next recalculation based on next due card
		this._scheduleNextRecalc(flashcards);
	}

	/**
	 * Schedule next recalculation for when the next card becomes due.
	 */
	private _scheduleNextRecalc(flashcards: FlashcardMetadata[]): void {
		// Clear any existing timeout
		this._clearRecalcTimeout();

		const now = new Date();

		// Find the next card that will become due (due date > now)
		const futureDueCards = flashcards
			.filter((f) => f.status === 'ACTIVE')
			.filter((f) => new Date(f.due) > now)
			.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

		const nextDueCard = futureDueCards[0];

		if (!nextDueCard) {
			// No future due cards - no need to schedule
			// Will reschedule when new events occur
			return;
		}

		// Calculate delay until next card becomes due
		const msUntilDue = new Date(nextDueCard.due).getTime() - now.getTime();

		// Add buffer and cap at maximum
		const delay = Math.min(
			msUntilDue + StatisticsProcessor.BUFFER_MS,
			StatisticsProcessor.MAX_RECALC_DELAY_MS,
		);

		this._recalcTimeout = setTimeout(() => {
			this._forceRecalculation();
		}, delay);
	}

	/**
	 * Clear the scheduled recalculation timeout.
	 */
	private _clearRecalcTimeout(): void {
		if (this._recalcTimeout) {
			clearTimeout(this._recalcTimeout);
			this._recalcTimeout = null;
		}
	}

	/**
	 * Handle review flashcard events - update daily progress and flashcard stats.
	 */
	private _handleReviewFlashcard(event: FlashcardReviewSessionScoreEvent): void {
		const currentData = this._statsAdapter.data;
		const today = this._formatDate(new Date());
		const { rating, difficulty, due, last_review } = event.data;

		// Get or create daily progress
		const currentProgress = currentData.progress[today] ?? this._createDailyProgress();

		// Calculate updated daily progress
		const newTotalCount = currentProgress.total_count + 1;
		const newCorrectCount = currentProgress.correct_count + (rating >= 3 ? 1 : 0);
		const newIncorrectCount = currentProgress.incorrect_count + (rating < 3 ? 1 : 0);
		const retention_rate = newTotalCount > 0 ? newCorrectCount / newTotalCount : 0;
		const goal_completed = newTotalCount >= currentData.flashcard.daily_goal;

		const updatedDailyProgress = {
			...currentProgress,
			total_count: newTotalCount,
			correct_count: newCorrectCount,
			incorrect_count: newIncorrectCount,
			retention_rate,
			goal_completed,
		};

		// Build updated progress object immutably
		const updatedProgress = {
			...currentData.progress,
			[today]: updatedDailyProgress,
		};

		// Calculate aggregate retention rate from all progress history
		const allProgress = Object.values(updatedProgress);
		const totalCorrectAllTime = allProgress.reduce((sum, day) => sum + day.correct_count, 0);
		const totalReviewsAllTime = allProgress.reduce((sum, day) => sum + day.total_count, 0);
		const aggregateRetentionRate =
			totalReviewsAllTime > 0 ? totalCorrectAllTime / totalReviewsAllTime : 0;

		// Calculate if card was "learned" today
		const midnightTomorrow = new Date();
		midnightTomorrow.setHours(24, 0, 0, 0);

		let totalLearned = currentData.flashcard.total_learned;

		// Card is learned if:
		// 1. It was reviewed today (has a new last_review timestamp for today)
		// 2. Its next due date is after midnight today (pushed to future)
		if (last_review) {
			const reviewDate = new Date(last_review);
			const dueDate = new Date(due);

			if (this._formatDate(reviewDate) === today && dueDate >= midnightTomorrow) {
				totalLearned++;
			}
		}

		// Update difficulty distribution
		const difficultyKey = Math.round(difficulty).toString();
		const difficulty_dist = {
			...currentData.flashcard.difficulty_dist,
			[difficultyKey]: (currentData.flashcard.difficulty_dist[difficultyKey] || 0) + 1,
		};

		this._statsAdapter.update({
			flashcard: {
				...currentData.flashcard,
				difficulty_dist,
				total_learned: totalLearned,
				retention_rate: aggregateRetentionRate,
			},
			progress: updatedProgress,
			updated_at: new Date().toISOString(),
		});
		this._statsAdapter.save();

		// Force immediate recalculation of due counts since card due date changed
		this._forceRecalculation();
	}

	/**
	 * Handle session end events - create session record and update overall stats.
	 */
	private _handleSessionEnd(event: FlashcardReviewSessionEndEvent): void {
		const currentData = this._statsAdapter.data;

		// Create new session record
		const newSession = {
			session_id: event.data.session_id,
			date: this._formatDate(new Date(event.data.end_time)),
			review_type: event.data.review_type,
			start_time: event.data.start_time,
			end_time: event.data.end_time,
			total_count: event.data.count,
			correct_count: event.data.correct_count,
			incorrect_count: event.data.incorrect_count,
			duration_s: event.data.duration,
		};

		// Update sessions array
		const sessions = [...currentData.sessions, newSession];

		// Get or create progress for date
		const dateKey = this._formatDate(new Date(event.data.end_time));
		const currentProgressForDate = currentData.progress[dateKey] ?? this._createDailyProgress();

		// Update progress for date
		const updatedProgressForDate: DailyProgress = {
			...currentProgressForDate,
			sessions_completed: currentProgressForDate.sessions_completed + 1,
			total_duration: currentProgressForDate.total_duration + event.data.duration,
		};

		const progress = {
			...currentData.progress,
			[dateKey]: updatedProgressForDate,
		};

		// Calculate streaks
		const { current_streak, longest_streak } = this._calculateStreaks(progress);

		this._statsAdapter.update({
			sessions,
			flashcard: {
				...currentData.flashcard,
				current_streak,
				longest_streak,
			},
			progress,
			updated_at: new Date().toISOString(),
		});
		this._statsAdapter.save();

		// Force immediate recalculation of due counts after session completes
		this._forceRecalculation();
	}

	/**
	 * Calculate current and longest streaks based on progress history.
	 */
	private _calculateStreaks(progress: Record<string, { total_count: number }>): {
		current_streak: number;
		longest_streak: number;
	} {
		const dates = Object.keys(progress).sort();

		if (dates.length === 0) {
			return { current_streak: 0, longest_streak: 0 };
		}

		let longestStreak = 0;
		let tempStreak = 0;
		let prevDate: Date | null = null;

		const today = this._formatDate(new Date());

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

				longestStreak = Math.max(longestStreak, tempStreak);
				prevDate = currentDate;
			} else {
				tempStreak = 0;
			}
		}

		// Current streak is the length of the contiguous block ending at the last active date.
		// tempStreak already holds this from the forward pass. Use it if last activity is today/yesterday.
		let currentStreak = 0;
		const lastDate = dates[dates.length - 1];
		const lastActivityTotal = progress[lastDate]?.total_count || 0;

		if (lastActivityTotal > 0) {
			const daysSinceLastActivity =
				(new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);

			if (daysSinceLastActivity <= 1) {
				currentStreak = tempStreak;
			}
		}

		return { current_streak: currentStreak, longest_streak: longestStreak };
	}

	/**
	 * Force immediate recalculation, bypassing the date cache.
	 * Use this when immediate due count update is needed (e.g., after review).
	 */
	private _forceRecalculation(): void {
		// Clear any pending scheduled recalc - we're doing it now
		this._clearRecalcTimeout();

		const event = new FlashcardIndexRecalcRequestEvent();
		EventBus.instance.publish(event);
	}

	/**
	 * Format date as YYYY-MM-DD string.
	 */
	private _formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	/**
	 * Create a new empty daily progress object.
	 */
	private _createDailyProgress(): DailyProgress {
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

	/**
	 * Clear recalc timeout and unsubscribe from EventBus.
	 */
	public dispose(): void {
		this._clearRecalcTimeout();
		super.dispose();
	}
}
