import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	FlashcardIndexInitializeHandler,
	FlashcardIndexGetHandler,
	FlashcardIndexCreateHandler,
} from '@/modules/events/handlers/flashcard/indexer';
import {
	FlashcardIndexInitializeEvent,
	FlashcardIndexGetRequestEvent,
	FlashcardIndexGetResponseEvent,
	FlashcardIndexCreateRequestEvent,
	FlashcardIndexCreateResponseEvent,
	FlashcardStatisticsComputeEvent,
	FlashcardIndexStateEvent,
} from '@/modules/events/domains/flashcard';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { CardStatus, FlashcardMetadata } from '@/schemas/flashcard';
import { IndexKey } from '@/types/indexes';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { State } from 'ts-fsrs';

function createMockMetadata(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	return {
		uuid: 'test-uuid',
		file: 'test.md',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		deleted_at: null,
		status: CardStatus.ACTIVE,
		decks: [],
		stability: 0,
		difficulty: 0,
		elapsed_days: 0,
		scheduled_days: 0,
		learning_steps: 0,
		reps: 0,
		lapses: 0,
		state: State.New,
		last_review: null,
		due: new Date().toISOString(),
		source: null,
		...overrides,
	};
}

describe('FlashcardIndexInitializeHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			initialize: vi.fn().mockResolvedValue(undefined),
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call indexer.initialize and publish FlashcardStatisticsComputeEvent', async () => {
		const handler = new FlashcardIndexInitializeHandler(mockDeps);
		const event = new FlashcardIndexInitializeEvent();

		await handler.handle(event);

		expect(mockIndexer.initialize).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});

describe('FlashcardIndexGetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			get: vi.fn().mockReturnValue(null),
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call indexer.get with the event id and publish response with result', async () => {
		const mockData = createMockMetadata({ uuid: 'test-uuid-1' });
		mockIndexer.get = vi.fn().mockReturnValue(mockData);

		const handler = new FlashcardIndexGetHandler(mockDeps);
		const event = new FlashcardIndexGetRequestEvent({ id: 'test-uuid-1' });

		await handler.handle(event);

		expect(mockIndexer.get).toHaveBeenCalledTimes(1);
		expect(mockIndexer.get).toHaveBeenCalledWith('test-uuid-1');
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexGetResponseEvent));
	});

	it('should publish response with null when indexer.get returns undefined', async () => {
		mockIndexer.get = vi.fn().mockReturnValue(undefined);

		const handler = new FlashcardIndexGetHandler(mockDeps);
		const event = new FlashcardIndexGetRequestEvent({ id: 'missing-id' });

		await handler.handle(event);

		expect(mockIndexer.get).toHaveBeenCalledWith('missing-id');
		expect(bus.publish).toHaveBeenCalledTimes(1);

		const published = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardIndexGetResponseEvent;
		expect(published.data).toBeNull();
	});
});

describe('FlashcardIndexCreateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			create: vi.fn().mockReturnValue({ uuid: 'new-uuid' }),
			save: vi.fn().mockResolvedValue(undefined),
			getAll: vi.fn().mockReturnValue([]),
			size: 0,
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call indexer.create and save, then publish response, state, and compute events', async () => {
		const mockData = createMockMetadata({ uuid: 'new-uuid', file: 'new.md' });
		mockIndexer.create = vi.fn().mockReturnValue(mockData);
		mockIndexer.getAll = vi.fn().mockReturnValue([mockData]);

		const handler = new FlashcardIndexCreateHandler(mockDeps);
		const event = new FlashcardIndexCreateRequestEvent({ ...mockData, uuid: 'new-uuid' });

		await handler.handle(event);

		expect(mockIndexer.create).toHaveBeenCalledTimes(1);
		expect(mockIndexer.create).toHaveBeenCalledWith(
			'new-uuid',
			expect.objectContaining({ uuid: 'new-uuid' }),
		);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(3);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexCreateResponseEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});
