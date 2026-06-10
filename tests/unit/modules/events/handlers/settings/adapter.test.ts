import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	SettingsAdapterInitHandler,
	SettingsAdapterResetHandler,
	SettingsAdapterSaveHandler,
	SettingsAdapterSetHandler,
	SettingsAdapterUpdateHandler,
} from '@/modules/events/handlers/settings/adapter';
import {
	SettingsAdapterInitEvent,
	SettingsAdapterResetEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterSetResponseEvent,
	SettingsAdapterStateEvent,
	SettingsAdapterUpdateRequestEvent,
	SettingsAdapterUpdateResponseEvent,
} from '@/modules/events/domains/settings/adapter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { AdapterKey } from '@/types/adapters';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { resetSingletons } from '../../../../../helpers/reset-singletons';

describe('SettingsAdapterInitHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			initialize: vi.fn().mockResolvedValue(undefined),
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.initialize()', async () => {
		const handler = new SettingsAdapterInitHandler(mockDeps);
		const event = new SettingsAdapterInitEvent();

		await handler.handle(event);

		expect(mockAdapter.initialize).toHaveBeenCalledTimes(1);
	});
});

describe('SettingsAdapterSetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			setField: vi.fn(),
			data: {
				flashcard: {
					marker: '?',
					watch: {
						directory: '/flashcards',
						tags: ['#flashcard'],
					},
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.setField() and publish SettingsAdapterSetResponseEvent', async () => {
		const handler = new SettingsAdapterSetHandler(mockDeps);
		const event = new SettingsAdapterSetRequestEvent({
			field: 'debounce_timeout_ms',
			value: 1000,
		});

		await handler.handle(event);

		expect(mockAdapter.setField).toHaveBeenCalledTimes(1);
		expect(mockAdapter.setField).toHaveBeenCalledWith('debounce_timeout_ms', 1000);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(SettingsAdapterSetResponseEvent),
		);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(SettingsAdapterStateEvent),
		);
		const publishedEvent = vi.mocked(bus.publish).mock.calls[0][0] as SettingsAdapterSetResponseEvent;
		expect(publishedEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as SettingsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});
describe('SettingsAdapterResetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			reset: vi.fn().mockResolvedValue(undefined),
			data: {
				flashcard: {
					marker: '?',
					watch: {
						directory: '/flashcards',
						tags: ['#flashcard'],
					},
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.reset() and publish SettingsAdapterStateEvent', async () => {
		const handler = new SettingsAdapterResetHandler(mockDeps);
		const event = new SettingsAdapterSetRequestEvent({
			field: 'debounce_timeout_ms',
			value: 1000,
		});

		await handler.handle(event);

		expect(mockAdapter.reset).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(SettingsAdapterStateEvent),
		);
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as SettingsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('SettingsAdapterSaveHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			save: vi.fn().mockResolvedValue(undefined),
			data: {
				flashcard: {
					marker: '?',
					watch: {
						directory: '/flashcards',
						tags: ['#flashcard'],
					},
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.save()', async () => {
		const handler = new SettingsAdapterSaveHandler(mockDeps);
		const event = new SettingsAdapterSaveEvent();

		await handler.handle(event);

		expect(mockAdapter.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('SettingsAdapterUpdateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: SettingsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			update: vi.fn(),
			data: {
				flashcard: {
					marker: '?',
					watch: {
						directory: '/flashcards',
						tags: ['#flashcard'],
					},
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as unknown as SettingsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.settings, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.update() and publish UpdateResponse and State events', async () => {
		const handler = new SettingsAdapterUpdateHandler(mockDeps);
		const event = new SettingsAdapterUpdateRequestEvent({
			debounce_timeout_ms: 1000,
		});

		await handler.handle(event);

		expect(mockAdapter.update).toHaveBeenCalledTimes(1);
		expect(mockAdapter.update).toHaveBeenCalledWith({
			debounce_timeout_ms: 1000,
		});
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(SettingsAdapterUpdateResponseEvent),
		);
		expect(bus.publish).toHaveBeenCalledWith(
			expect.any(SettingsAdapterStateEvent),
		);
		const responseEvent = vi.mocked(bus.publish).mock.calls[0][0] as SettingsAdapterUpdateResponseEvent;
		expect(responseEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as SettingsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});
