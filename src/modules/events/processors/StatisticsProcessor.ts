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
	FlashcardIndexSaveEvent,
	FlashcardIndexUpdateEvent,
	FlashcardReviewSessionEndEvent,
	FlashcardReviewSessionScoreEvent,
} from '../domains';

export class StatisticsProcessor extends EventProcessor {
	protected readonly eventTypes: string[] = [
		FlashcardReviewSessionScoreEvent.type,
		FlashcardReviewSessionEndEvent.type,
		FlashcardIndexCreateEvent.type,
		FlashcardIndexDeleteEvent.type,
		FlashcardIndexInitializeEvent.type,
		FlashcardIndexSaveEvent.type,
		FlashcardIndexUpdateEvent.type,
	];

	private _recalcTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly _statsAdapter: StatisticsAdapter;

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
		} else if (this._isIndexFlashcardEvent(event)) {
			this._scheduleRecalculation();
		}
	}

	/**
	 * Check if event is an index flashcard event.
	 */
	private _isIndexFlashcardEvent(event: IEvent): boolean {
		const indexTypes: string[] = [
			FlashcardIndexCreateEvent.type,
			FlashcardIndexDeleteEvent.type,
			FlashcardIndexInitializeEvent.type,
			FlashcardIndexSaveEvent.type,
			FlashcardIndexUpdateEvent.type,
		];
		return indexTypes.includes(event.type);
	}

	/**
	 * Handle review flashcard events - update daily progress and flashcard stats.
	 */
	private _handleReviewFlashcard(event: FlashcardReviewSessionScoreEvent): void {
		const currentData = this._statsAdapter.data;
		const today = this._formatDate(new Date());
		const { rating, difficulty } = event.data;

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
			},
			progress: updatedProgress,
			updated_at: new Date().toISOString(),
		});
		this._statsAdapter.save();
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
		const updatedProgressForDate = {
			...currentProgressForDate,
			sessions_completed: currentProgressForDate.sessions_completed + 1,
			total_duration: currentProgressForDate.total_duration + event.data.duration,
		};

		const progress = {
			...currentData.progress,
			[dateKey]: updatedProgressForDate,
		};

		this._statsAdapter.update({
			sessions,
			progress,
			updated_at: new Date().toISOString(),
		});
		this._statsAdapter.save();
	}

	/**
	 * Handle index flashcard events - schedule recalculation on relevant changes.
	 */
	private _handleIndexFlashcard(event: IEvent): void {
		// Schedule recalculation for events that affect flashcard counts/stats
		const recalcTriggeringEvents: string[] = [
			FlashcardIndexCreateEvent.type,
			FlashcardIndexDeleteEvent.type,
			FlashcardIndexInitializeEvent.type,
			FlashcardIndexUpdateEvent.type,
		];
		if (recalcTriggeringEvents.includes(event.type)) {
			this._scheduleRecalculation();
		}
	}

	/**
	 * Debounce recalculation requests.
	 */
	private _scheduleRecalculation(): void {
		if (this._recalcTimeout) {
			clearTimeout(this._recalcTimeout);
		}

		this._recalcTimeout = setTimeout(() => {
			this._recalcTimeout = null;
			const event = new FlashcardIndexRecalcRequestEvent();
			EventBus.instance.publish(event);
		}, 100);
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
	private _createDailyProgress() {
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
		if (this._recalcTimeout) {
			clearTimeout(this._recalcTimeout);
			this._recalcTimeout = null;
		}
		super.dispose();
	}
}
