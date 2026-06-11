import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardMetadata } from '@/schemas';
import { AdapterKey } from '@/types/adapters';
import { IndexKey } from '@/types/indexes';
import {
	calculateStreaks,
	computeAggregateRetentionRate,
	createDailyProgress,
	createReviewSessionRecord,
	formatDate,
	isCardLearnedToday,
	updateDailyProgressFromReview,
	updateDifficultyDistribution,
	updateProgressFromSession,
} from '@/utils/statistics-utils';
import { EventBus } from '../../core/EventBus';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardReviewSessionEndEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardReviewSessionStartEvent,
	FlashcardStatisticsComputeEvent,
	FlashcardWriterFmRequestEvent,
} from '../../domains/flashcard';

export class FlashcardReviewSessionStartHandler extends EventHandler<FlashcardReviewSessionStartEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardReviewSessionStartEvent): Promise<void> {
		// No-op: session start is handled by UI layer
	}
}

export class FlashcardReviewSessionScoreHandler extends EventHandler<FlashcardReviewSessionScoreEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardReviewSessionScoreEvent): Promise<void> {
		const card = event.data;
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const stats = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;

		// 1. Update card in indexer
		indexer.update(card.uuid, card as unknown as Partial<FlashcardMetadata>);

		// 2. Save indexer
		await indexer.save();

		// 3. Update stats adapter (daily progress, difficulty, total learned, retention rate)
		const currentData = stats.data;
		const today = formatDate(new Date());
		const { rating, difficulty, due, last_review } = event.data;
		const currentProgress = currentData.progress[today] ?? createDailyProgress();
		const updatedDailyProgress = updateDailyProgressFromReview(
			currentProgress,
			rating,
			currentData.flashcard.daily_goal,
		);
		const updatedProgress = { ...currentData.progress, [today]: updatedDailyProgress };
		const aggregateRetentionRate = computeAggregateRetentionRate(updatedProgress);
		let totalLearned = currentData.flashcard.total_learned;
		if (last_review) {
			const reviewDate = new Date(last_review);
			const dueDate = new Date(due);
			if (isCardLearnedToday(reviewDate, dueDate, today)) {
				totalLearned++;
			}
		}
		const difficulty_dist = updateDifficultyDistribution(
			currentData.flashcard.difficulty_dist,
			difficulty,
		);
		stats.update({
			flashcard: {
				...currentData.flashcard,
				difficulty_dist,
				total_learned: totalLearned,
				retention_rate: aggregateRetentionRate,
			},
			progress: updatedProgress,
			updated_at: new Date().toISOString(),
		});
		stats.save();

		// 4. Publish FlashcardWriterFmRequestEvent to update file on disk
		EventBus.instance.publish(
			new FlashcardWriterFmRequestEvent({ filepath: card.filepath, fm: card }),
		);

		// 5. Publish FlashcardStatisticsComputeEvent
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardReviewSessionEndHandler extends EventHandler<FlashcardReviewSessionEndEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardReviewSessionEndEvent): Promise<void> {
		const stats = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		const currentData = stats.data;
		const newSession = createReviewSessionRecord(event.data);
		const sessions = [...currentData.sessions, newSession];
		const dateKey = formatDate(new Date(event.data.end_time));
		const currentProgressForDate = currentData.progress[dateKey] ?? createDailyProgress();
		const updatedProgressForDate = updateProgressFromSession(
			currentProgressForDate,
			event.data.duration,
		);
		const progress = { ...currentData.progress, [dateKey]: updatedProgressForDate };
		const { current_streak, longest_streak } = calculateStreaks(progress, dateKey);
		stats.update({
			sessions,
			flashcard: { ...currentData.flashcard, current_streak, longest_streak },
			progress,
			updated_at: new Date().toISOString(),
		});
		stats.save();

		// Publish statistics compute event to recalculate statistics
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}
