import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import type { DailyProgress, ReviewSession, Stats } from '@/schemas/statistics';
import {
	EventData,
	EventType,
	FlashcardIndexInitEvent,
	QueueInitEvent,
	ReviewFlashcardEvent,
	SessionEndEvent,
} from '@/types/events';
import { State } from 'ts-fsrs';
import { EventListener } from './EventListener';

export class StatisticsListener extends EventListener {
	protected readonly eventTypes = [
		EventType.ReviewFlashcard,
		EventType.QueueInit,
		EventType.SessionEnd,
		EventType.IndexInit,
	];

	constructor(private _statsAdapter: StatisticsAdapter) {
		super();
	}

	protected process(event: EventData<unknown>): void {
		switch (event.event_type) {
			case EventType.QueueInit:
				this.handleQueueInit(event as QueueInitEvent);
				break;
			case EventType.ReviewFlashcard:
				this.handleReview(event as ReviewFlashcardEvent);
				break;
			case EventType.SessionEnd:
				this.handleSessionEnd(event as SessionEndEvent);
				break;
			case EventType.IndexInit:
				this.handleIndexInit(event as FlashcardIndexInitEvent);
				break;
		}
	}

	private handleIndexInit(event: FlashcardIndexInitEvent): void {
		const { total_cards, due_today } = event.data;
		this._statsAdapter.update({
			total_cards,
			due_today,
		} as Partial<Stats>);
		this._statsAdapter.save();
	}

	private handleQueueInit(event: QueueInitEvent): void {
		const entity = event.data;
		this._statsAdapter.update({
			total_cards: entity.total_cards,
			due_today: entity.due_today,
		} as Partial<Stats>);
		this._statsAdapter.save();
	}

	private handleReview(event: ReviewFlashcardEvent): void {
		const stats = this._statsAdapter.data;

		const today = this.formatDate(event.created_at);
		if (!stats.progress[today]) {
			stats.progress[today] = this.createDailyProgress();
		}
		const dailyProgress = stats.progress[today];

		dailyProgress.total_count++;
		if (event.rating >= 3) dailyProgress.correct_count++;
		else dailyProgress.incorrect_count++;
		dailyProgress.retention_rate =
			dailyProgress.total_count > 0 ? dailyProgress.correct_count / dailyProgress.total_count : 0;
		dailyProgress.goal_completed = dailyProgress.total_count >= stats.daily_goal;

		if (event.data.state === State.Review) {
			stats.total_learned++;
		}

		this.updateStreaks(stats);

		this._statsAdapter.save();
	}

	private handleSessionEnd(event: SessionEndEvent): void {
		const stats = this._statsAdapter.data;
		const {
			session_id,
			review_type,
			date,
			start_time,
			end_time,
			total_count,
			correct_count,
			incorrect_count,
			duration_s,
			due_today,
		} = event.data;

		stats.sessions.push({
			session_id,
			date,
			review_type,
			start_time,
			end_time,
			total_count,
			correct_count,
			incorrect_count,
			duration_s,
		});

		if (!stats.progress[date]) {
			stats.progress[date] = this.createDailyProgress();
		}
		stats.progress[date].sessions_completed++;
		stats.progress[date].total_duration += duration_s;

		const totalReviewed = stats.sessions.reduce(
			(sum: number, s: ReviewSession) => sum + s.total_count,
			0,
		);
		const totalCorrect = stats.sessions.reduce(
			(sum: number, s: ReviewSession) => sum + s.correct_count,
			0,
		);
		stats.retention_rate = totalReviewed > 0 ? totalCorrect / totalReviewed : 0;

		stats.total_reviews = totalReviewed;
		stats.due_today = due_today;

		this.updateStreaks(stats);

		this._statsAdapter.save();
	}

	private updateStreaks(stats: Stats): void {
		const today = this.formatDate(new Date());
		const sortedDays = Object.keys(stats.progress).sort((a: string, b: string) =>
			b.localeCompare(a),
		);

		if (sortedDays.length === 0) return;

		const lastReviewDate = sortedDays[0];

		if (lastReviewDate === today) {
			const todayProgress = stats.progress[today];
			if (todayProgress?.goal_completed && stats.current_streak === 0) {
				stats.current_streak = 1;
				stats.longest_streak = Math.max(stats.longest_streak, 1);
			}
			return;
		}

		const daysSince = this.daysBetween(lastReviewDate, today);

		if (daysSince > 1) {
			stats.current_streak = 0;
		} else if (daysSince === 1) {
			const yesterdayProgress = stats.progress[lastReviewDate];
			if (yesterdayProgress?.goal_completed) {
				stats.current_streak++;
				stats.longest_streak = Math.max(stats.longest_streak, stats.current_streak);
			} else {
				stats.current_streak = 0;
			}
		}
	}

	private formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	private daysBetween(date1: string, date2: string): number {
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
	}

	private createDailyProgress(): DailyProgress {
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
}
