import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlashcardStatisticsComputeHandler } from '@/modules/events/handlers/statistics/compute';
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
import { StatisticsDashboardOpenHandler } from '@/modules/events/handlers/statistics/compute';
import { DashboardOpenEvent } from '@/modules/events/domains/ui/dashboard';

describe('FlashcardStatisticsComputeHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockStats: StatisticsAdapter;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));

		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		const mockStatsData: Stats = {
			...DEFAULT_STATISTICS,
			updated_at: '2026-06-08T00:00:00.000Z',
		};

		mockStats = {
			data: mockStatsData,
			update: vi.fn(),
			save: vi.fn(),
		} as unknown as StatisticsAdapter;

		const mockFlashcards = [
			{ status: 'ACTIVE', due: '2026-06-10T10:00:00.000Z' },
			{ status: 'ACTIVE', due: '2026-06-11T10:00:00.000Z' },
		] as unknown as FlashcardMetadata[];

		mockIndexer = {
			getAll: vi.fn().mockReturnValue(mockFlashcards),
		} as unknown as FlashcardIndexer;

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

	it('should call indexer.getAll(), stats.update(), and stats.save()', async () => {
		const handler = new FlashcardStatisticsComputeHandler(mockDeps);
		const event = new FlashcardStatisticsComputeEvent();

		await handler.handle(event);

		expect(mockIndexer.getAll).toHaveBeenCalledTimes(1);
		expect(mockStats.update).toHaveBeenCalledTimes(1);
		expect(mockStats.update).toHaveBeenCalledWith({
			flashcard: {
				...mockStats.data.flashcard,
				due_now: 0,
				due_today: 0,
				next_review: '2026-06-10T10:00:00.000Z',
				expected_review_time: 60,
				total_cards: 2,
			},
			updated_at: '2026-06-08T12:00:00.000Z',
		});
		expect(mockStats.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'Statistics:Adapter:State' }),
		);
	});
	it('should schedule next compute when future due cards exist', async () => {
		const handler = new FlashcardStatisticsComputeHandler(mockDeps);
		const event = new FlashcardStatisticsComputeEvent();

		// One card due in 30 seconds
		mockIndexer.getAll = vi
			.fn()
			.mockReturnValue([
				{ status: 'ACTIVE', due: '2026-06-08T12:00:30.000Z' },
			] as unknown as FlashcardMetadata[]);

		await handler.handle(event);

		expect(bus.publish).toHaveBeenCalledTimes(1);

		// Advance by 30 seconds + BUFFER_MS (300ms)
		await vi.advanceTimersByTimeAsync(30_000 + 300);

		expect(bus.publish).toHaveBeenCalledTimes(2);
		const secondCall = vi.mocked(bus.publish).mock.calls[1][0] as { type: string };
		expect(secondCall.type).toBe('Flashcard:Statistics:Compute');
	});

	it('should not schedule next compute when no future due cards exist', async () => {
		const handler = new FlashcardStatisticsComputeHandler(mockDeps);
		const event = new FlashcardStatisticsComputeEvent();

		// All cards already due (no future due cards)
		mockIndexer.getAll = vi
			.fn()
			.mockReturnValue([
				{ status: 'ACTIVE', due: '2026-06-08T11:00:00.000Z' },
			] as unknown as FlashcardMetadata[]);

		await handler.handle(event);

		expect(bus.publish).toHaveBeenCalledTimes(1);

		// Advance beyond MAX_RECALC_DELAY_MS (24 hours) + 1
		await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 1);

		expect(bus.publish).toHaveBeenCalledTimes(1);
	});
});
describe('FlashcardStatisticsComputeHandler — _clearNextCompute', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockStats: StatisticsAdapter;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));

		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		const mockStatsData: Stats = {
			...DEFAULT_STATISTICS,
			updated_at: '2026-06-08T00:00:00.000Z',
		};

		mockStats = {
			data: mockStatsData,
			update: vi.fn(),
			save: vi.fn(),
		} as unknown as StatisticsAdapter;

		const mockFlashcards = [
			{ status: 'ACTIVE', due: '2026-06-08T12:00:30.000Z' },
		] as unknown as FlashcardMetadata[];

		mockIndexer = {
			getAll: vi.fn().mockReturnValue(mockFlashcards),
		} as unknown as FlashcardIndexer;

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

	it('should clear previous timeout when handle is called again', async () => {
		const handler = new FlashcardStatisticsComputeHandler(mockDeps);
		const event = new FlashcardStatisticsComputeEvent();

		await handler.handle(event);
		expect(bus.publish).toHaveBeenCalledTimes(1);

		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

		await handler.handle(event);

		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
	});
});

describe('FlashcardStatisticsComputeHandler — _handleNextCompute when delay === null', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockStats: StatisticsAdapter;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));

		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		const mockStatsData: Stats = {
			...DEFAULT_STATISTICS,
			updated_at: '2026-06-08T00:00:00.000Z',
		};

		mockStats = {
			data: mockStatsData,
			update: vi.fn(),
			save: vi.fn(),
		} as unknown as StatisticsAdapter;

		mockIndexer = {
			getAll: vi.fn().mockReturnValue([]),
		} as unknown as FlashcardIndexer;

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

	it('should not call setTimeout when delay is null', async () => {
		const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
		const handler = new FlashcardStatisticsComputeHandler(mockDeps);
		const event = new FlashcardStatisticsComputeEvent();

		await handler.handle(event);

		expect(setTimeoutSpy).not.toHaveBeenCalled();
		expect(bus.publish).toHaveBeenCalledTimes(1);
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
