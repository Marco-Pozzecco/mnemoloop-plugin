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
		expect(bus.publish).not.toHaveBeenCalled();
	});
});
