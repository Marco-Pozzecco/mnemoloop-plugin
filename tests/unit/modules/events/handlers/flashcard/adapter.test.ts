import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { AdapterKey } from '@/types/adapters';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import {
	FlashcardAdapterInitHandler,
	FlashcardAdapterResetHandler,
	FlashcardAdapterSaveHandler,
	FlashcardAdapterSetHandler,
	FlashcardAdapterUpdateHandler,
} from '@/modules/events/handlers/flashcard/adapter';
import {
	FlashcardAdapterInitEvent,
	FlashcardAdapterResetEvent,
	FlashcardAdapterSaveEvent,
	FlashcardAdapterSetRequestEvent,
	FlashcardAdapterSetResponseEvent,
	FlashcardAdapterStateEvent,
	FlashcardAdapterUpdateRequestEvent,
	FlashcardAdapterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/adapter';

describe('FlashcardAdapterInitHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: FlashcardAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			initialize: vi.fn().mockResolvedValue(undefined),
			data: { flashcards: [], updated_at: null },
		} as unknown as FlashcardAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.flashcard, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.initialize() and publish state event', async () => {
		const handler = new FlashcardAdapterInitHandler(mockDeps);
		const event = new FlashcardAdapterInitEvent();

		await handler.handle(event);

		expect(mockAdapter.initialize).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterStateEvent),
		);
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('FlashcardAdapterResetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: FlashcardAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			reset: vi.fn().mockResolvedValue(undefined),
			data: { flashcards: [], updated_at: null },
		} as unknown as FlashcardAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.flashcard, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.reset() and publish state event', async () => {
		const handler = new FlashcardAdapterResetHandler(mockDeps);
		const event = new FlashcardAdapterResetEvent({ flashcards: [], updated_at: null });

		await handler.handle(event);

		expect(mockAdapter.reset).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterStateEvent),
		);
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('FlashcardAdapterSaveHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: FlashcardAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			save: vi.fn().mockResolvedValue(undefined),
			data: { flashcards: [], updated_at: null },
		} as unknown as FlashcardAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.flashcard, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.save() and publish state event', async () => {
		const handler = new FlashcardAdapterSaveHandler(mockDeps);
		const event = new FlashcardAdapterSaveEvent();

		await handler.handle(event);

		expect(mockAdapter.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterStateEvent),
		);
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('FlashcardAdapterSetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: FlashcardAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			set: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
			data: { flashcards: [], updated_at: null },
		} as unknown as FlashcardAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.flashcard, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.set() and publish response + state events', async () => {
		const handler = new FlashcardAdapterSetHandler(mockDeps);
		const event = new FlashcardAdapterSetRequestEvent({ flashcards: [], updated_at: null });

		await handler.handle(event);

		expect(mockAdapter.set).toHaveBeenCalledTimes(1);
		expect(mockAdapter.set).toHaveBeenCalledWith({ flashcards: [], updated_at: null });
		expect(mockAdapter.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterSetResponseEvent),
		);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterStateEvent),
		);
		const responseEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardAdapterSetResponseEvent;
		expect(responseEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as FlashcardAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('FlashcardAdapterUpdateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: FlashcardAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			update: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
			data: { flashcards: [], updated_at: null },
		} as unknown as FlashcardAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.flashcard, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.update() and publish response + state events', async () => {
		const handler = new FlashcardAdapterUpdateHandler(mockDeps);
		const event = new FlashcardAdapterUpdateRequestEvent({ flashcards: [], updated_at: null });

		await handler.handle(event);

		expect(mockAdapter.update).toHaveBeenCalledTimes(1);
		expect(mockAdapter.update).toHaveBeenCalledWith({ flashcards: [], updated_at: null });
		expect(mockAdapter.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterUpdateResponseEvent),
		);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(FlashcardAdapterStateEvent),
		);
		const responseEvent = vi.mocked(bus.publish).mock.calls[0][0] as FlashcardAdapterUpdateResponseEvent;
		expect(responseEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as FlashcardAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});
