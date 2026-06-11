import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { AdapterKey } from '@/types/adapters';
import { IndexKey } from '@/types/indexes';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardYaml } from '@/schemas';
import { DEFAULT_STATISTICS, Stats } from '@/schemas/statistics';
import { createFlashcardYaml } from '../../../../../helpers/factories';
import {
	FlashcardReviewSessionStartHandler,
	FlashcardReviewSessionScoreHandler,
	FlashcardReviewSessionEndHandler,
} from '@/modules/events/handlers/flashcard/review';
import {
	FlashcardReviewSessionStartEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardReviewSessionEndEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardStatisticsComputeEvent,
} from '@/modules/events/domains/flashcard';

const TEST_UUID = '00000000-0000-0000-0000-000000000000';

describe('FlashcardReviewSessionStartHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should resolve without error (no-op)', async () => {
		const handler = new FlashcardReviewSessionStartHandler(mockDeps);
		const event = new FlashcardReviewSessionStartEvent({
			session_id: 'sess-1',
			start_time: Date.now(),
		});

		await expect(handler.handle(event)).resolves.toBeUndefined();
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('FlashcardReviewSessionScoreHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let mockStats: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');
		vi.spyOn(EventBus.instance, 'publish');

		mockIndexer = {
			update: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardIndexer;

		mockStats = {
			data: JSON.parse(JSON.stringify(DEFAULT_STATISTICS)),
			update: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockStats]]),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should update indexer, stats, and publish events when card is learned today', async () => {
		const handler = new FlashcardReviewSessionScoreHandler(mockDeps);
		const card: FlashcardYaml & { filepath: string; rating: number } = {
			...createFlashcardYaml({
				uuid: TEST_UUID,
				due: '2026-06-09T12:00:00Z',
				last_review: '2026-06-08T10:00:00Z',
			}),
			filepath: 'test.md',
			rating: 3,
		};
		const event = new FlashcardReviewSessionScoreEvent(card);

		await handler.handle(event);

		expect(mockIndexer.update).toHaveBeenCalledTimes(1);
		expect(mockIndexer.update).toHaveBeenCalledWith(TEST_UUID, expect.any(Object));
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);

		expect(mockStats.update).toHaveBeenCalledTimes(1);
		const statsUpdateArg = vi.mocked(mockStats.update).mock.calls[0][0] as Partial<Stats>;
		expect(statsUpdateArg.flashcard).toMatchObject({
			difficulty_dist: { '0': 1 },
			total_learned: 1,
			retention_rate: 1,
		});
		expect(statsUpdateArg.progress).toHaveProperty('2026-06-08');
		expect(mockStats.save).toHaveBeenCalledTimes(1);

		expect(EventBus.instance.publish).toHaveBeenCalledTimes(2);
		expect(EventBus.instance.publish).toHaveBeenCalledWith(
			expect.any(FlashcardWriterFmRequestEvent),
		);
		expect(EventBus.instance.publish).toHaveBeenCalledWith(
			expect.any(FlashcardStatisticsComputeEvent),
		);
	});

	it('should not increment total_learned when last_review is null', async () => {
		const handler = new FlashcardReviewSessionScoreHandler(mockDeps);
		const card: FlashcardYaml & { filepath: string; rating: number } = {
			...createFlashcardYaml({
				uuid: TEST_UUID,
				due: '2026-06-09T12:00:00Z',
				last_review: null,
			}),
			filepath: 'test.md',
			rating: 3,
		};
		const event = new FlashcardReviewSessionScoreEvent(card);

		await handler.handle(event);

		expect(mockIndexer.update).toHaveBeenCalledTimes(1);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);

		expect(mockStats.update).toHaveBeenCalledTimes(1);
		const statsUpdateArg = vi.mocked(mockStats.update).mock.calls[0][0] as Partial<Stats>;
		expect(statsUpdateArg.flashcard).toMatchObject({
			total_learned: 0,
		});
		expect(mockStats.save).toHaveBeenCalledTimes(1);
	});

	it('should not increment total_learned when card was not learned today', async () => {
		const handler = new FlashcardReviewSessionScoreHandler(mockDeps);
		const card: FlashcardYaml & { filepath: string; rating: number } = {
			...createFlashcardYaml({
				uuid: TEST_UUID,
				due: '2026-06-09T12:00:00Z',
				last_review: '2026-06-07T10:00:00Z',
			}),
			filepath: 'test.md',
			rating: 3,
		};
		const event = new FlashcardReviewSessionScoreEvent(card);

		await handler.handle(event);

		expect(mockIndexer.update).toHaveBeenCalledTimes(1);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);

		expect(mockStats.update).toHaveBeenCalledTimes(1);
		const statsUpdateArg = vi.mocked(mockStats.update).mock.calls[0][0] as Partial<Stats>;
		expect(statsUpdateArg.flashcard).toMatchObject({
			total_learned: 0,
		});
		expect(mockStats.save).toHaveBeenCalledTimes(1);
	});
});

describe('FlashcardReviewSessionEndHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockStats: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');
		vi.spyOn(EventBus.instance, 'publish');

		mockStats = {
			data: JSON.parse(JSON.stringify(DEFAULT_STATISTICS)),
			update: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockStats]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should update stats with session, progress, streaks and publish compute event', async () => {
		const handler = new FlashcardReviewSessionEndHandler(mockDeps);
		const event = new FlashcardReviewSessionEndEvent({
			session_id: 'sess-1',
			review_type: 'flashcard',
			date: '2026-06-08',
			start_time: 1000,
			end_time: new Date('2026-06-08T12:10:00Z').getTime(),
			duration: 600,
			count: 5,
			correct_count: 4,
			incorrect_count: 1,
		});

		await handler.handle(event);

		expect(mockStats.update).toHaveBeenCalledTimes(1);
		const statsUpdateArg = vi.mocked(mockStats.update).mock.calls[0][0] as Partial<Stats>;

		expect(statsUpdateArg.sessions).toHaveLength(1);
		expect(statsUpdateArg.sessions?.[0]).toMatchObject({
			session_id: 'sess-1',
			date: '2026-06-08',
			review_type: 'flashcard',
			start_time: 1000,
			total_count: 5,
			correct_count: 4,
			incorrect_count: 1,
			duration_s: 600,
		});

		expect(statsUpdateArg.progress).toHaveProperty('2026-06-08');
		expect(statsUpdateArg.progress?.['2026-06-08']).toMatchObject({
			sessions_completed: 1,
			total_duration: 600,
		});

		expect(statsUpdateArg.flashcard).toMatchObject({
			current_streak: expect.any(Number),
			longest_streak: expect.any(Number),
		});

		expect(mockStats.save).toHaveBeenCalledTimes(1);

		expect(EventBus.instance.publish).toHaveBeenCalledTimes(1);
		expect(EventBus.instance.publish).toHaveBeenCalledWith(
			expect.any(FlashcardStatisticsComputeEvent),
		);
	});
});
