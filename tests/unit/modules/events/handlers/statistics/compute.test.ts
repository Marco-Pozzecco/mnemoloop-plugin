import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	FlashcardStatisticsComputeHandler,
	StatisticsDashboardOpenHandler,
} from '@/modules/events/handlers/statistics/compute';
import { FlashcardStatisticsComputeEvent } from '@/modules/events/domains/flashcard/statistics';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { AdapterKey } from '@/types/adapters';
import { IndexKey } from '@/types/indexes';
import { EventBus } from '@/modules/events/core/EventBus';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Stats, DEFAULT_STATISTICS } from '@/schemas/statistics';
import { FlashcardMetadata } from '@/schemas';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { DashboardOpenEvent } from '@/modules/events/domains/ui/dashboard';

type MockStats = StatisticsAdapter & {
	update: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
};

type MockIndexer = FlashcardIndexer & {
	getAll: ReturnType<typeof vi.fn>;
};

interface Harness {
	deps: IEventRegistryDependencies;
	stats: MockStats;
	indexer: MockIndexer;
	bus: EventBus;
}

function createHarness(
	options: {
		flashcards?: FlashcardMetadata[];
		statsData?: Stats;
		statsInitialized?: boolean;
		indexerInitialized?: boolean;
	} = {},
): Harness {
	resetSingletons();
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));

	const bus = EventBus.instance;
	vi.spyOn(bus, 'publish');

	const stats = {
		data:
			options.statsData ??
			({
				...DEFAULT_STATISTICS,
				updated_at: '2026-06-08T00:00:00.000Z',
			} as Stats),
		update: vi.fn(),
		save: vi.fn().mockResolvedValue(undefined),
		initialized: options.statsInitialized ?? true,
	} as unknown as MockStats;

	// Mirror the real adapter: update() merges into data, so a second identical
	// compute sees the values produced by the first one.
	stats.update.mockImplementation((data: Partial<Stats>) => {
		(stats as unknown as { data: Stats }).data = {
			...(stats as unknown as { data: Stats }).data,
			...data,
		} as Stats;
	});

	const indexer = {
		getAll: vi.fn().mockReturnValue(options.flashcards ?? []),
		initialized: options.indexerInitialized ?? true,
	} as unknown as MockIndexer;

	const deps: IEventRegistryDependencies = {
		plugin: {} as IEventRegistryDependencies['plugin'],
		adapters: new Map([[AdapterKey.statistics, stats]]),
		indexes: new Map([[IndexKey.flashcard, indexer]]),
		parsers: new Map(),
		writers: new Map(),
		bus,
	};

	return { deps, stats, indexer, bus };
}

function activeCard(due: string): FlashcardMetadata {
	return { status: 'ACTIVE', due } as unknown as FlashcardMetadata;
}

describe('FlashcardStatisticsComputeHandler', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('should call indexer.getAll(), stats.update(), and stats.save()', async () => {
		const { deps, stats, indexer, bus } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z'), activeCard('2026-06-11T10:00:00.000Z')],
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(indexer.getAll).toHaveBeenCalledTimes(1);
		expect(stats.update).toHaveBeenCalledTimes(1);
		expect(stats.update).toHaveBeenCalledWith({
			flashcard: {
				...DEFAULT_STATISTICS.flashcard,
				due_now: 0,
				due_today: 0,
				next_review: '2026-06-10T10:00:00.000Z',
				expected_review_time: 60,
				total_cards: 2,
			},
			updated_at: '2026-06-08T12:00:00.000Z',
		});
		expect(stats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'Statistics:Adapter:State' }),
		);
	});

	it('should schedule next compute when future due cards exist', async () => {
		const { deps, bus } = createHarness({
			flashcards: [activeCard('2026-06-08T12:00:30.000Z')],
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(bus.publish).toHaveBeenCalledTimes(1);

		// Advance by 30 seconds + BUFFER_MS (300ms)
		await vi.advanceTimersByTimeAsync(30_000 + 300);

		expect(bus.publish).toHaveBeenCalledTimes(2);
		const secondCall = vi.mocked(bus.publish).mock.calls[1][0] as { type: string };
		expect(secondCall.type).toBe('Flashcard:Statistics:Compute');
	});

	it('should not schedule next compute when no future due cards exist', async () => {
		const { deps, bus } = createHarness({
			flashcards: [activeCard('2026-06-08T11:00:00.000Z')],
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(bus.publish).toHaveBeenCalledTimes(1);

		// Advance beyond MAX_RECALC_DELAY_MS (24 hours) + 1
		await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 1);

		expect(bus.publish).toHaveBeenCalledTimes(1);
	});

	it('should clear previous timeout when handle is called again', async () => {
		const { deps, bus } = createHarness({
			flashcards: [activeCard('2026-06-08T12:00:30.000Z')],
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());
		expect(bus.publish).toHaveBeenCalledTimes(1);

		const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
	});

	it('should not call setTimeout when delay is null', async () => {
		const { deps, bus } = createHarness({ flashcards: [] });
		const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(setTimeoutSpy).not.toHaveBeenCalled();
		expect(bus.publish).toHaveBeenCalledTimes(1);
	});
});

describe('FlashcardStatisticsComputeHandler — initialization gate', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not compute while the statistics adapter is not initialized', async () => {
		const { deps, stats, indexer, bus } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z')],
			statsInitialized: false,
			indexerInitialized: true,
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(indexer.getAll).not.toHaveBeenCalled();
		expect(stats.update).not.toHaveBeenCalled();
		expect(stats.save).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});

	it('should not compute while the flashcard indexer is not initialized', async () => {
		const { deps, stats, indexer, bus } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z')],
			statsInitialized: true,
			indexerInitialized: false,
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(indexer.getAll).not.toHaveBeenCalled();
		expect(stats.update).not.toHaveBeenCalled();
		expect(stats.save).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});

	it('should compute once both the adapter and the indexer are initialized', async () => {
		const { deps, stats, indexer, bus } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z')],
			statsInitialized: true,
			indexerInitialized: true,
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(indexer.getAll).toHaveBeenCalledTimes(1);
		expect(stats.update).toHaveBeenCalledTimes(1);
		expect(stats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
	});
});

describe('FlashcardStatisticsComputeHandler — unchanged computes', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not update or save when the recomputed values are identical', async () => {
		const { deps, stats, bus } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z')],
		});

		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());
		expect(stats.update).toHaveBeenCalledTimes(1);
		expect(stats.save).toHaveBeenCalledTimes(1);

		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(stats.update).toHaveBeenCalledTimes(1);
		expect(stats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenLastCalledWith(
			expect.objectContaining({ type: 'Statistics:Adapter:State' }),
		);
	});

	it('should save when a computed value changed', async () => {
		const { deps, stats, indexer } = createHarness({
			flashcards: [activeCard('2026-06-10T10:00:00.000Z')],
		});
		const handler = new FlashcardStatisticsComputeHandler(deps);
		await handler.handle(new FlashcardStatisticsComputeEvent());
		expect(stats.save).toHaveBeenCalledTimes(1);

		indexer.getAll.mockReturnValue([
			activeCard('2026-06-10T10:00:00.000Z'),
			activeCard('2026-06-11T10:00:00.000Z'),
		]);
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(stats.update).toHaveBeenCalledTimes(2);
		expect(stats.save).toHaveBeenCalledTimes(2);
	});

	it('should not save on repeated computes over an empty index', async () => {
		const { deps, stats, bus } = createHarness({ flashcards: [] });
		const handler = new FlashcardStatisticsComputeHandler(deps);

		await handler.handle(new FlashcardStatisticsComputeEvent());
		await handler.handle(new FlashcardStatisticsComputeEvent());
		await handler.handle(new FlashcardStatisticsComputeEvent());

		expect(stats.update).not.toHaveBeenCalled();
		expect(stats.save).not.toHaveBeenCalled();
		expect(bus.publish).toHaveBeenCalledTimes(3);
	});

	it('should reschedule the next compute when the values are unchanged', async () => {
		const { deps, stats, bus } = createHarness({
			flashcards: [activeCard('2026-06-08T12:00:30.000Z')],
		});
		const handler = new FlashcardStatisticsComputeHandler(deps);

		await handler.handle(new FlashcardStatisticsComputeEvent());
		expect(stats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);

		const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
		const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

		await handler.handle(new FlashcardStatisticsComputeEvent());

		// Unchanged: no write, but the state is published and the timer re-armed.
		expect(stats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(30_000 + 300);
		expect(bus.publish).toHaveBeenCalledTimes(3);
		expect(stats.save).toHaveBeenCalledTimes(1);
	});
});

describe('StatisticsDashboardOpenHandler', () => {
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');
	});

	it('should publish FlashcardStatisticsComputeEvent', async () => {
		const mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};

		const handler = new StatisticsDashboardOpenHandler(mockDeps);
		const event = new DashboardOpenEvent();

		await handler.handle(event);

		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'Flashcard:Statistics:Compute' }),
		);
	});
});
