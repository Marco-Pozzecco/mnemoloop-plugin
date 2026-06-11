import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../../../helpers/reset-singletons';
import { AdapterKey } from '@/types/adapters';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { DEFAULT_STATISTICS } from '@/schemas/statistics';
import {
	StatisticsAdapterInitHandler,
	StatisticsAdapterResetHandler,
	StatisticsAdapterSaveHandler,
	StatisticsAdapterSetHandler,
	StatisticsAdapterUpdateHandler,
} from '@/modules/events/handlers/statistics/adapter';
import {
	StatisticsAdapterInitEvent,
	StatisticsAdapterResetEvent,
	StatisticsAdapterSaveEvent,
	StatisticsAdapterSetRequestEvent,
	StatisticsAdapterSetResponseEvent,
	StatisticsAdapterStateEvent,
	StatisticsAdapterUpdateRequestEvent,
	StatisticsAdapterUpdateResponseEvent,
} from '@/modules/events/domains/statistics/adapter';

describe('StatisticsAdapterInitHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			initialize: vi.fn().mockResolvedValue(undefined),
			data: DEFAULT_STATISTICS,
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.initialize() and publish StatisticsAdapterStateEvent', async () => {
		const handler = new StatisticsAdapterInitHandler(mockDeps);
		const event = new StatisticsAdapterInitEvent();

		await handler.handle(event);

		expect(mockAdapter.initialize).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterStateEvent));
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as StatisticsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('StatisticsAdapterResetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			reset: vi.fn().mockResolvedValue(undefined),
			data: DEFAULT_STATISTICS,
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.reset() and publish StatisticsAdapterStateEvent', async () => {
		const handler = new StatisticsAdapterResetHandler(mockDeps);
		const event = new StatisticsAdapterResetEvent();

		// The handler is typed for StatisticsAdapterSetRequestEvent but ignores event data;
		// cast to satisfy the generic boundary.
		await handler.handle(event as unknown as StatisticsAdapterSetRequestEvent);

		expect(mockAdapter.reset).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledTimes(1);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterStateEvent));
		const stateEvent = vi.mocked(bus.publish).mock.calls[0][0] as StatisticsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('StatisticsAdapterSaveHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			save: vi.fn().mockResolvedValue(undefined),
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.save()', async () => {
		const handler = new StatisticsAdapterSaveHandler(mockDeps);
		const event = new StatisticsAdapterSaveEvent();

		await handler.handle(event);

		expect(mockAdapter.save).toHaveBeenCalledTimes(1);
		expect(bus.publish).not.toHaveBeenCalled();
	});
});

describe('StatisticsAdapterSetHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			setField: vi.fn(),
			data: DEFAULT_STATISTICS,
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.setField() and publish response and state events', async () => {
		const handler = new StatisticsAdapterSetHandler(mockDeps);
		const event = new StatisticsAdapterSetRequestEvent({
			field: 'flashcard.daily_goal' as never,
			value: 10,
		});

		await handler.handle(event);

		expect(mockAdapter.setField).toHaveBeenCalledTimes(1);
		expect(mockAdapter.setField).toHaveBeenCalledWith('flashcard.daily_goal', 10);
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterSetResponseEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterStateEvent));
		const responseEvent = vi.mocked(bus.publish).mock.calls[0][0] as StatisticsAdapterSetResponseEvent;
		expect(responseEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as StatisticsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});

describe('StatisticsAdapterUpdateHandler', () => {
	let mockDeps: IEventRegistryDependencies;
	let mockAdapter: StatisticsAdapter;
	let bus: EventBus;

	beforeEach(() => {
		resetSingletons();
		bus = EventBus.instance;
		vi.spyOn(bus, 'publish');

		mockAdapter = {
			update: vi.fn(),
			data: DEFAULT_STATISTICS,
		} as unknown as StatisticsAdapter;

		mockDeps = {
			plugin: {} as IEventRegistryDependencies['plugin'],
			adapters: new Map([[AdapterKey.statistics, mockAdapter]]),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
	});

	it('should call adapter.update() and publish response and state events', async () => {
		const handler = new StatisticsAdapterUpdateHandler(mockDeps);
		const event = new StatisticsAdapterUpdateRequestEvent({
			flashcard: { daily_goal: 20 },
		});

		await handler.handle(event);

		expect(mockAdapter.update).toHaveBeenCalledTimes(1);
		expect(mockAdapter.update).toHaveBeenCalledWith({ flashcard: { daily_goal: 20 } });
		expect(bus.publish).toHaveBeenCalledTimes(2);
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterUpdateResponseEvent));
		expect(bus.publish).toHaveBeenCalledWith(expect.any(StatisticsAdapterStateEvent));
		const responseEvent = vi.mocked(bus.publish).mock.calls[0][0] as StatisticsAdapterUpdateResponseEvent;
		expect(responseEvent.data).toEqual(mockAdapter.data);
		const stateEvent = vi.mocked(bus.publish).mock.calls[1][0] as StatisticsAdapterStateEvent;
		expect(stateEvent.data).toEqual(mockAdapter.data);
	});
});
