import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	FlashcardIndexInitializeHandler,
	FlashcardIndexGetHandler,
	FlashcardIndexCreateHandler,
	FlashcardIndexSaveHandler,
	FlashcardIndexGetAllHandler,
	FlashcardIndexQueryHandler,
	FlashcardIndexUpdateHandler,
	FlashcardIndexDeleteHandler,
	FlashcardIndexOnVaultCreateHandler,
	FlashcardIndexOnVaultDeleteHandler,
	FlashcardIndexOnVaultModifyHandler,
	FlashcardIndexOnVaultRenameHandler,
} from '@/modules/events/handlers/flashcard/indexer';
import {
	FlashcardIndexInitEvent,
	FlashcardIndexGetRequestEvent,
	FlashcardIndexGetResponseEvent,
	FlashcardIndexCreateRequestEvent,
	FlashcardIndexCreateResponseEvent,
	FlashcardStatisticsComputeEvent,
	FlashcardIndexStateEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
	FlashcardIndexUpdateRequestEvent,
	FlashcardIndexUpdateResponseEvent,
	FlashcardIndexDeleteRequestEvent,
	FlashcardIndexDeleteResponseEvent,
} from '@/modules/events/domains/flashcard';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '@/modules/events/domains/vault';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { CardStatus, CardType, FlashcardMetadata } from '@/schemas/flashcard';
import { IndexKey } from '@/types/indexes';
import { ParserKey } from '@/types/parsers';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { State } from 'ts-fsrs';
import { Logger } from '@/utils/Logger';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';

function createMockMetadata(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	return {
		uuid: 'test-uuid',
		file: 'test.md',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: CardStatus.ACTIVE,
		decks: [],
		card_type: CardType.Basic,
		stability: 0,
		difficulty: 0,
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

	it('should call indexer.initialize and publish FlashcardStatisticsComputeEvent', async () => {
		const handler = new FlashcardIndexInitializeHandler(mockDeps);
		const event = new FlashcardIndexInitEvent();

		await handler.handle(event);

		expect(mockIndexer.initialize).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
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
describe('FlashcardIndexSaveHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			save: vi.fn().mockResolvedValue(undefined),
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

	it('should call indexer.save once', async () => {
		const handler = new FlashcardIndexSaveHandler(mockDeps);
		const event = new FlashcardIndexSaveEvent({ flashcards: [], total: 0 });

		await handler.handle(event);

		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
	});
});

describe('FlashcardIndexGetAllHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			getAll: vi.fn().mockReturnValue([]),
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

	it('should call indexer.getAll and publish response with result', async () => {
		const mockData = createMockMetadata({ uuid: 'test-uuid' });
		mockIndexer.getAll = vi.fn().mockReturnValue([mockData]);

		const handler = new FlashcardIndexGetAllHandler(mockDeps);
		const event = new FlashcardIndexGetAllRequestEvent();

		await handler.handle(event);

		expect(mockIndexer.getAll).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexGetAllResponseEvent));
	});
});

describe('FlashcardIndexQueryHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			query: vi.fn().mockReturnValue([]),
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

	it('should call indexer.query and publish response with result', async () => {
		const mockData = createMockMetadata({ uuid: 'test-uuid' });
		mockIndexer.query = vi.fn().mockReturnValue([mockData]);

		const handler = new FlashcardIndexQueryHandler(mockDeps);
		const event = new FlashcardIndexQueryRequestEvent({ predicate: () => true });

		await handler.handle(event);

		expect(mockIndexer.query).toHaveBeenCalledTimes(1);
		expect(mockIndexer.query).toHaveBeenCalledWith(expect.any(Function));
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexQueryResponseEvent));
	});
});

describe('FlashcardIndexUpdateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			update: vi.fn().mockReturnValue({ uuid: 'test-uuid' }),
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

	it('should call indexer.update and publish response, state, and compute events', async () => {
		const mockData = createMockMetadata({ uuid: 'test-uuid' });
		mockIndexer.update = vi.fn().mockReturnValue(mockData);
		mockIndexer.getAll = vi.fn().mockReturnValue([mockData]);

		const handler = new FlashcardIndexUpdateHandler(mockDeps);
		const event = new FlashcardIndexUpdateRequestEvent({ ...mockData, uuid: 'test-uuid' });

		await handler.handle(event);

		expect(mockIndexer.update).toHaveBeenCalledTimes(1);
		expect(mockIndexer.update).toHaveBeenCalledWith('test-uuid', expect.any(Object));
		expect(bus.publish).toHaveBeenCalledTimes(3);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexUpdateResponseEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});

describe('FlashcardIndexDeleteHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			delete: vi.fn().mockReturnValue(true),
			getAll: vi.fn().mockReturnValue([]),
			size: 0,
			save: vi.fn().mockResolvedValue(undefined),
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

	it('should call indexer.delete and publish response, state, and compute events', async () => {
		const mockData = createMockMetadata({ uuid: 'test-uuid' });
		const handler = new FlashcardIndexDeleteHandler(mockDeps);
		const event = new FlashcardIndexDeleteRequestEvent(mockData);

		await handler.handle(event);

		expect(mockIndexer.delete).toHaveBeenCalledTimes(1);
		expect(mockIndexer.delete).toHaveBeenCalledWith('test-uuid');
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(3);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexDeleteResponseEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});

describe('FlashcardIndexOnVaultCreateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let mockParser: FlashcardParser;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockData = createMockMetadata({ uuid: 'test-uuid', file: 'test.md' });

		mockParser = {
			parseYaml: vi
				.fn()
				.mockResolvedValue({ entity: { uuid: 'test-uuid' }, stats: { created_at: '', updated_at: '' }, filepath: 'test.md', success: true }),
		} as unknown as FlashcardParser;

		mockIndexer = {
			isPathInWatchedDir: vi.fn().mockReturnValue(true),
			generateMetadata: vi.fn().mockReturnValue(mockData),
			upsert: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
			getAll: vi.fn().mockReturnValue([mockData]),
			size: 1,
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {
				app: {
					vault: {
						getFileByPath: vi.fn().mockReturnValue({
							stat: { ctime: 1000, mtime: 2000 },
						}),
					},
				},
			} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	let mockData: FlashcardMetadata;

	it('should parse metadata, upsert, save, and publish state and compute events', async () => {
		const handler = new FlashcardIndexOnVaultCreateHandler(mockDeps);
		const event = new VaultCreateEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.isPathInWatchedDir).toHaveBeenCalledWith('test.md');
		expect(mockParser.parseYaml).toHaveBeenCalledWith('test.md');
		expect(mockIndexer.upsert).toHaveBeenCalledWith('test-uuid', expect.any(Object));
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});

	it('should return early when entity is not flashcard', async () => {
		const handler = new FlashcardIndexOnVaultCreateHandler(mockDeps);
		const event = new VaultCreateEvent({ entity: 'note', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.isPathInWatchedDir).not.toHaveBeenCalled();
		expect(mockParser.parseYaml).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});

	it('should return early when path is not in watched dir', async () => {
		mockIndexer.isPathInWatchedDir = vi.fn().mockReturnValue(false);

		const handler = new FlashcardIndexOnVaultCreateHandler(mockDeps);
		const event = new VaultCreateEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.isPathInWatchedDir).toHaveBeenCalledWith('test.md');
		expect(mockParser.parseYaml).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('FlashcardIndexOnVaultDeleteHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockIndexer = {
			isPathInWatchedDir: vi.fn().mockReturnValue(true),
			findByFilepath: vi.fn().mockReturnValue({ uuid: 'test-uuid' }),
			delete: vi.fn(),
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

	it('should find, delete, save, and publish state and compute events', async () => {
		const handler = new FlashcardIndexOnVaultDeleteHandler(mockDeps);
		const event = new VaultDeleteEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.findByFilepath).toHaveBeenCalledWith('test.md');
		expect(mockIndexer.delete).toHaveBeenCalledWith('test-uuid');
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});

	it('should return early when entity is not flashcard', async () => {
		const handler = new FlashcardIndexOnVaultDeleteHandler(mockDeps);
		const event = new VaultDeleteEvent({ entity: 'note', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.isPathInWatchedDir).not.toHaveBeenCalled();
		expect(mockIndexer.findByFilepath).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});

	it('should return early when path is not in watched dir', async () => {
		mockIndexer.isPathInWatchedDir = vi.fn().mockReturnValue(false);

		const handler = new FlashcardIndexOnVaultDeleteHandler(mockDeps);
		const event = new VaultDeleteEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.isPathInWatchedDir).toHaveBeenCalledWith('test.md');
		expect(mockIndexer.findByFilepath).not.toHaveBeenCalled();
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('FlashcardIndexOnVaultModifyHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let mockParser: FlashcardParser;
	let bus: EventBus;
	let mockData: FlashcardMetadata;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockData = createMockMetadata({ uuid: 'test-uuid', file: 'test.md' });

		mockParser = {
			parseYaml: vi
				.fn()
				.mockResolvedValue({ entity: { uuid: 'test-uuid' }, stats: { created_at: '', updated_at: '' }, filepath: 'test.md', success: true }),
		} as unknown as FlashcardParser;

		mockIndexer = {
			isPathInWatchedDir: vi.fn().mockReturnValue(true),
			findByFilepath: vi.fn().mockReturnValue({ uuid: 'test-uuid', entity: mockData }),
			generateMetadata: vi.fn().mockReturnValue(mockData),
			update: vi.fn(),
			delete: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
			getAll: vi.fn().mockReturnValue([mockData]),
			size: 1,
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {
				app: {
					vault: {
						getFileByPath: vi.fn().mockReturnValue({
							stat: { ctime: 1000, mtime: 2000 },
						}),
					},
				},
			} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should update and save when parseMetadata succeeds', async () => {
		const handler = new FlashcardIndexOnVaultModifyHandler(mockDeps);
		const event = new VaultModifyEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.update).toHaveBeenCalledTimes(1);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});

	it('should delete and save when parseMetadata throws', async () => {
		mockParser.parseYaml = vi.fn().mockRejectedValue(new Error('parse failed'));

		const handler = new FlashcardIndexOnVaultModifyHandler(mockDeps);
		const event = new VaultModifyEvent({ entity: 'flashcard', path: 'test.md' });

		await handler.handle(event);

		expect(mockIndexer.findByFilepath).toHaveBeenCalledWith('test.md');
		expect(mockIndexer.delete).toHaveBeenCalledWith('test-uuid');
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});

describe('FlashcardIndexOnVaultRenameHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockIndexer: FlashcardIndexer;
	let mockParser: FlashcardParser;
	let bus: EventBus;
	let mockData: FlashcardMetadata;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockData = createMockMetadata({ uuid: 'test-uuid', file: 'test.md' });

		mockParser = {
			parseYaml: vi
				.fn()
				.mockResolvedValue({ entity: { uuid: 'test-uuid' }, stats: { created_at: '', updated_at: '' }, filepath: 'new.md', success: true }),
		} as unknown as FlashcardParser;
		mockIndexer = {
			isPathInWatchedDir: vi.fn().mockReturnValue(true),
			findByFilepath: vi.fn().mockReturnValue({ uuid: 'test-uuid', entity: mockData }),
			upsert: vi.fn(),
			generateMetadata: vi.fn().mockReturnValue(mockData),
			save: vi.fn().mockResolvedValue(undefined),
			getAll: vi.fn().mockReturnValue([mockData]),
			size: 1,
		} as unknown as FlashcardIndexer;

		mockDeps = {
			plugin: {
				app: {
					vault: {
						getFileByPath: vi.fn().mockReturnValue({
							stat: { ctime: 1000, mtime: 2000 },
						}),
					},
				},
			} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]),
			parsers: new Map([[ParserKey.flashcard, mockParser]]),
			writers: new Map(),
			bus,
		};
	});

	it('should upsert existing entity with new file path and save', async () => {
		const handler = new FlashcardIndexOnVaultRenameHandler(mockDeps);
		const event = new VaultRenameEvent({ entity: 'flashcard', path: 'new.md', oldPath: 'old.md' });

		await handler.handle(event);

		expect(mockIndexer.findByFilepath).toHaveBeenCalledWith('old.md');
		expect(mockIndexer.upsert).toHaveBeenCalledWith(
			'test-uuid',
			expect.objectContaining({ file: 'new.md' }),
		);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});

	it('should parse and upsert when no existing entity but path is in watched dir', async () => {
		mockIndexer.findByFilepath = vi.fn().mockReturnValue(undefined);

		const handler = new FlashcardIndexOnVaultRenameHandler(mockDeps);
		const event = new VaultRenameEvent({ entity: 'flashcard', path: 'new.md', oldPath: 'old.md' });

		await handler.handle(event);

		expect(mockIndexer.findByFilepath).toHaveBeenCalledWith('old.md');
		expect(mockParser.parseYaml).toHaveBeenCalledWith('new.md');
		expect(mockIndexer.generateMetadata).toHaveBeenCalledWith({ uuid: 'test-uuid' }, 'new.md', {
			created_at: '1970-01-01T00:00:01.000Z',
			updated_at: '1970-01-01T00:00:02.000Z',
		});
		expect(mockIndexer.upsert).toHaveBeenCalledWith('test-uuid', expect.any(Object));
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
	});

	it('should call Logger.error when upsert throws', async () => {
		mockIndexer.upsert = vi.fn().mockImplementation(() => {
			throw new Error('upsert failed');
		});
		vi.spyOn(Logger, 'error');

		const handler = new FlashcardIndexOnVaultRenameHandler(mockDeps);
		const event = new VaultRenameEvent({ entity: 'flashcard', path: 'new.md', oldPath: 'old.md' });

		await handler.handle(event);

		expect(Logger.error).toHaveBeenCalled();
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardIndexStateEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(FlashcardStatisticsComputeEvent));
	});
});
