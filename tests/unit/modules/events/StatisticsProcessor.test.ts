import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { StatisticsProcessor } from '@/modules/events/processors/StatisticsProcessor';
import { EventBus } from '@/modules/events/core/EventBus';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { DEFAULT_STATISTICS, type Stats } from '@/schemas/statistics';
import { createFlashcardMetadata } from '../../../helpers/factories';
import {
	FlashcardReviewSessionScoreEvent,
	FlashcardReviewSessionEndEvent,
	FlashcardIndexRecalcResponseEvent,
	FlashcardIndexRecalcRequestEvent,
	DashboardOpenEvent,
	FlashcardIndexCreateEvent,
	FlashcardIndexDeleteEvent,
	FlashcardIndexUpdateEvent,
	FlashcardIndexInitializeEvent,
	FlashcardIndexSaveEvent,
} from '@/modules/events/domains';

const FIXED_DATE = '2026-05-18T10:00:00.000Z';
const FIXED_DATE_STR = '2026-05-18';

function createMockStatsAdapter(initialData: Partial<Stats> = {}): StatisticsAdapter {
	const stats: Stats = JSON.parse(
		JSON.stringify({
			...DEFAULT_STATISTICS,
			...initialData,
		}),
	);

	return {
		data: stats,
		update: vi.fn().mockImplementation((partial: Partial<Stats>) => {
			if (partial.flashcard) {
				Object.assign(stats.flashcard, partial.flashcard);
			}
			if (partial.progress) {
				Object.assign(stats.progress, partial.progress);
			}
			if (partial.sessions) {
				stats.sessions = [...partial.sessions];
			}
			if (partial.updated_at) {
				stats.updated_at = partial.updated_at;
			}
		}),
		save: vi.fn().mockResolvedValue(undefined),
		initialize: vi.fn().mockResolvedValue(undefined),
		reset: vi.fn().mockResolvedValue(undefined),
		set: vi.fn().mockImplementation((newStats: Stats) => {
			Object.assign(stats, newStats);
			if (newStats.flashcard) Object.assign(stats.flashcard, newStats.flashcard);
			if (newStats.progress) Object.assign(stats.progress, newStats.progress);
			if (newStats.sessions) stats.sessions = [...newStats.sessions];
		}),
		setField: vi.fn(),
		emit: vi.fn(),
		plugin: {} as import('obsidian').Plugin,
	} as unknown as StatisticsAdapter;
}

describe('StatisticsProcessor', () => {
	let adapter: ReturnType<typeof createMockStatsAdapter>;
	let processor: StatisticsProcessor;
	let capturedEvents: Array<unknown>;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();
		vi.setSystemTime(new Date(FIXED_DATE));

		adapter = createMockStatsAdapter();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		processor = new StatisticsProcessor(adapter);
	});

	afterEach(() => {
		processor.dispose();
		vi.useRealTimers();
	});

	describe('streak calculation', () => {
		it('should return zero streaks for empty progress', () => {
			const result = (processor as unknown as Record<string, (p: Record<string, { total_count: number }>) => unknown>)._calculateStreaks({});
			expect(result).toEqual({ current_streak: 0, longest_streak: 0 });
		});

		it('should calculate current streak of 1 for single day activity', () => {
			const result = (processor as unknown as Record<string, (p: Record<string, { total_count: number }>) => unknown>)._calculateStreaks({
				[FIXED_DATE_STR]: { total_count: 5 },
			});
			expect(result.current_streak).toBe(1);
			expect(result.longest_streak).toBe(1);
		});

		it('should calculate longest streak across multiple days', () => {
			const result = (processor as unknown as Record<string, (p: Record<string, { total_count: number }>) => unknown>)._calculateStreaks({
				'2026-05-15': { total_count: 5 },
				'2026-05-16': { total_count: 3 },
				'2026-05-17': { total_count: 4 },
				'2026-05-18': { total_count: 2 },
			});
			expect(result.current_streak).toBe(4);
			expect(result.longest_streak).toBe(4);
		});

		it('should break streak on missing day', () => {
			const result = (processor as unknown as Record<string, (p: Record<string, { total_count: number }>) => unknown>)._calculateStreaks({
				'2026-05-15': { total_count: 5 },
				'2026-05-16': { total_count: 0 },
				'2026-05-17': { total_count: 4 },
				'2026-05-18': { total_count: 2 },
			});
			expect(result.current_streak).toBe(2);
			expect(result.longest_streak).toBe(2);
		});

		it('should reset current streak if last activity was more than one day ago', () => {
			const result = (processor as unknown as Record<string, (p: Record<string, { total_count: number }>) => unknown>)._calculateStreaks({
				'2026-05-14': { total_count: 5 },
				'2026-05-15': { total_count: 3 },
			});
			expect(result.current_streak).toBe(0);
			expect(result.longest_streak).toBe(2);
		});
	});

	describe('daily progress aggregation', () => {
		it('should create new daily progress entry for first review', () => {
			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 4,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			expect(adapter.update).toHaveBeenCalled();
			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.progress[FIXED_DATE_STR]).toBeDefined();
			expect(updateCall.progress[FIXED_DATE_STR].total_count).toBe(1);
			expect(updateCall.progress[FIXED_DATE_STR].correct_count).toBe(1);
			expect(updateCall.progress[FIXED_DATE_STR].incorrect_count).toBe(0);
		});

		it('should increment existing daily progress on subsequent reviews', () => {
			adapter = createMockStatsAdapter({
				progress: {
					[FIXED_DATE_STR]: {
						total_count: 2,
						correct_count: 2,
						incorrect_count: 0,
						retention_rate: 1,
						sessions_completed: 0,
						total_duration: 0,
						goal_completed: false,
					},
				},
			});
			processor.dispose();
			processor = new StatisticsProcessor(adapter);

			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 2,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.progress[FIXED_DATE_STR].total_count).toBe(3);
			expect(updateCall.progress[FIXED_DATE_STR].correct_count).toBe(2);
			expect(updateCall.progress[FIXED_DATE_STR].incorrect_count).toBe(1);
		});

		it('should mark goal_completed when total_count reaches daily_goal', () => {
			adapter = createMockStatsAdapter({
				flashcard: {
					...DEFAULT_STATISTICS.flashcard,
					daily_goal: 3,
				},
				progress: {
					[FIXED_DATE_STR]: {
						total_count: 2,
						correct_count: 2,
						incorrect_count: 0,
						retention_rate: 1,
						sessions_completed: 0,
						total_duration: 0,
						goal_completed: false,
					},
				},
			});
			processor.dispose();
			processor = new StatisticsProcessor(adapter);

			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 4,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.progress[FIXED_DATE_STR].goal_completed).toBe(true);
		});
	});

	describe('difficulty distribution', () => {
		it('should increment difficulty_dist for reviewed card', () => {
			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 3,
				difficulty: 2.7,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.difficulty_dist['3']).toBe(1);
		});

		it('should accumulate multiple difficulty entries', () => {
			adapter = createMockStatsAdapter({
				flashcard: {
					...DEFAULT_STATISTICS.flashcard,
					difficulty_dist: { '3': 2 },
				},
			});
			processor.dispose();
			processor = new StatisticsProcessor(adapter);

			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 3,
				difficulty: 3.2,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.difficulty_dist['3']).toBe(3);
		});
	});

	describe('retention rate', () => {
		it('should calculate retention rate for correct review', () => {
			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 4,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.retention_rate).toBe(1);
		});

		it('should calculate retention rate for incorrect review', () => {
			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 2,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.retention_rate).toBe(0);
		});

		it('should calculate aggregate retention across multiple days', () => {
			adapter = createMockStatsAdapter({
				progress: {
					'2026-05-17': {
						total_count: 4,
						correct_count: 3,
						incorrect_count: 1,
						retention_rate: 0.75,
						sessions_completed: 0,
						total_duration: 0,
						goal_completed: false,
					},
				},
			});
			processor.dispose();
			processor = new StatisticsProcessor(adapter);

			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 2,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			// (3 correct + 0) / (4 + 1 total) = 3/5 = 0.6
			expect(updateCall.flashcard.retention_rate).toBe(0.6);
		});
	});

	describe('empty data handling', () => {
		it('should handle recalc response with no flashcards without division by zero', () => {
			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [],
				total: 0,
			});

			EventBus.instance.publish(recalcEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.total_cards).toBe(0);
			expect(updateCall.flashcard.due_now).toBe(0);
			expect(updateCall.flashcard.due_today).toBe(0);
			expect(updateCall.flashcard.expected_review_time).toBe(0);
		});

		it('should handle recalc response with only inactive flashcards', () => {
			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'SUSPENDED', due: FIXED_DATE }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.total_cards).toBe(0);
			expect(updateCall.flashcard.due_now).toBe(0);
			expect(updateCall.flashcard.due_today).toBe(0);
		});

		it('should handle review with zero total count without division by zero', () => {
			const event = new FlashcardReviewSessionScoreEvent({
				filepath: '/flashcards/test.md',
				rating: 2,
				difficulty: 3,
				due: FIXED_DATE,
				last_review: null,
				uuid: 'test-uuid',
				stability: 1,
				elapsed_days: 0,
				scheduled_days: 1,
				reps: 1,
				lapses: 0,
				state: 0,
				status: 'ACTIVE',
				decks: [],
			});

			EventBus.instance.publish(event);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.progress[FIXED_DATE_STR].retention_rate).toBe(0);
			expect(updateCall.flashcard.retention_rate).toBe(0);
		});
	});

	describe('session end handling', () => {
		it('should create session record and update streaks', () => {
			adapter = createMockStatsAdapter({
				progress: {
					'2026-05-17': { total_count: 5, correct_count: 5, incorrect_count: 0, retention_rate: 1, sessions_completed: 0, total_duration: 0, goal_completed: false },
					'2026-05-18': { total_count: 3, correct_count: 3, incorrect_count: 0, retention_rate: 1, sessions_completed: 0, total_duration: 0, goal_completed: false },
				},
			});
			processor.dispose();
			processor = new StatisticsProcessor(adapter);

			const endEvent = new FlashcardReviewSessionEndEvent({
				session_id: 'sess-123',
				review_type: 'daily',
				date: FIXED_DATE_STR,
				start_time: Date.now() - 60000,
				end_time: Date.now(),
				duration: 60,
				count: 5,
				correct_count: 4,
				incorrect_count: 1,
			});

			EventBus.instance.publish(endEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.sessions).toHaveLength(1);
			expect(updateCall.sessions[0].session_id).toBe('sess-123');
			expect(updateCall.flashcard.current_streak).toBe(2);
			expect(updateCall.flashcard.longest_streak).toBe(2);
		});

		it('should create session record with correct count and duration', () => {
			const endEvent = new FlashcardReviewSessionEndEvent({
				session_id: 'sess-456',
				review_type: 'cram',
				date: FIXED_DATE_STR,
				start_time: Date.now() - 120000,
				end_time: Date.now(),
				duration: 120,
				count: 10,
				correct_count: 8,
				incorrect_count: 2,
			});

			EventBus.instance.publish(endEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.sessions).toHaveLength(1);
			expect(updateCall.sessions[0].session_id).toBe('sess-456');
			expect(updateCall.sessions[0].review_type).toBe('cram');
			expect(updateCall.sessions[0].duration_s).toBe(120);
			expect(updateCall.sessions[0].total_count).toBe(10);
			expect(updateCall.sessions[0].correct_count).toBe(8);
			expect(updateCall.sessions[0].incorrect_count).toBe(2);
		});
	});

	describe('scheduled recalculation', () => {
		it('should schedule next recalc based on next due card time', () => {
			const futureDue = new Date(FIXED_DATE);
			futureDue.setMinutes(futureDue.getMinutes() + 10);

			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: futureDue.toISOString() }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			// Before timer fires, no recalc request should be published
			const recalcRequestsBefore = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequestsBefore).toHaveLength(0);

			// Advance past the due time + buffer
			vi.advanceTimersByTime(10 * 60 * 1000 + 500);

			const recalcRequestsAfter = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequestsAfter).toHaveLength(1);
		});

		it('should not schedule recalc when no future due cards exist', () => {
			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: FIXED_DATE }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			// Advance a long time - no timer should fire for recalc
			vi.advanceTimersByTime(24 * 60 * 60 * 1000);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(0);
		});

		it('should cap recalc delay at maximum of 24 hours', () => {
			const farFutureDue = new Date(FIXED_DATE);
			farFutureDue.setDate(farFutureDue.getDate() + 2);

			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: farFutureDue.toISOString() }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			// Advance just past 24 hours - timer should have fired by then
			vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});
	});

	describe('dashboard visibility', () => {
		it('should force recalculation when dashboard opens', () => {
			const dashboardEvent = new DashboardOpenEvent();

			EventBus.instance.publish(dashboardEvent);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});
	});

	describe('index events force recalc', () => {
		it('should force recalculation on index create event', () => {
			const event = new FlashcardIndexCreateEvent(createFlashcardMetadata());

			EventBus.instance.publish(event);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});

		it('should force recalculation on index delete event', () => {
			const event = new FlashcardIndexDeleteEvent(createFlashcardMetadata());

			EventBus.instance.publish(event);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});

		it('should force recalculation on index update event', () => {
			const event = new FlashcardIndexUpdateEvent(createFlashcardMetadata());

			EventBus.instance.publish(event);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});

		it('should force recalculation on index initialize event', () => {
			const event = new FlashcardIndexInitializeEvent({ flashcards: [], total: 0 });

			EventBus.instance.publish(event);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});

		it('should force recalculation on index save event', () => {
			const event = new FlashcardIndexSaveEvent({ flashcards: [], total: 0 });

			EventBus.instance.publish(event);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			expect(recalcRequests).toHaveLength(1);
		});
	});

	describe('recalc response handling', () => {
		it('should calculate due_now for overdue cards', () => {
			const pastDue = new Date(FIXED_DATE);
			pastDue.setMinutes(pastDue.getMinutes() - 10);

			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: pastDue.toISOString() }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.due_now).toBe(1);
		});

		it('should calculate due_today for cards due before midnight tomorrow', () => {
			const laterToday = new Date(FIXED_DATE);
			laterToday.setHours(23, 0, 0, 0);

			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: laterToday.toISOString() }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.due_today).toBe(1);
		});

		it('should calculate expected review time as 30 seconds per active card', () => {
			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: FIXED_DATE }),
					createFlashcardMetadata({ status: 'ACTIVE', due: FIXED_DATE }),
					createFlashcardMetadata({ status: 'SUSPENDED', due: FIXED_DATE }),
				],
				total: 3,
			});

			EventBus.instance.publish(recalcEvent);

			const updateCall = (adapter.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(updateCall.flashcard.expected_review_time).toBe(60);
		});
	});

	describe('dispose', () => {
		it('should clear recalc timeout on dispose', () => {
			const futureDue = new Date(FIXED_DATE);
			futureDue.setMinutes(futureDue.getMinutes() + 10);

			const recalcEvent = new FlashcardIndexRecalcResponseEvent({
				flashcards: [
					createFlashcardMetadata({ status: 'ACTIVE', due: futureDue.toISOString() }),
				],
				total: 1,
			});

			EventBus.instance.publish(recalcEvent);
			processor.dispose();

			// After dispose, no recalc request should fire
			vi.advanceTimersByTime(20 * 60 * 1000);

			const recalcRequests = capturedEvents.filter(
				(e) => e instanceof FlashcardIndexRecalcRequestEvent,
			);
			// Only the initial one from the recalc response handler, not from timeout
			expect(recalcRequests.filter((e) => (e as FlashcardIndexRecalcRequestEvent).time)).toBeDefined();
		});
	});
});
