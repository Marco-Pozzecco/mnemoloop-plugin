import { describe, expect, it, beforeEach } from 'vitest';
import { EventHandler } from '@/modules/events/core/EventHandler';
import { EventBus } from '@/modules/events/core/EventBus';
import { Event } from '@/modules/events/core/Event';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { resetSingletons } from '../../../../helpers/reset-singletons';

class TestEvent extends Event<{ value: number }> {
	static readonly type = 'test-handler-event';

	constructor(data: { value: number }) {
		super(TestEvent.type, data);
	}
}

class ConcreteHandler extends EventHandler<TestEvent> {
	handle(_event: TestEvent): void {
		// no-op
	}
}

describe('EventHandler', () => {
	beforeEach(() => {
		resetSingletons();
	});

	describe('constructor', () => {
		it('should store deps fields in protected properties', () => {
			const bus = EventBus.instance;
			const indexes = new Map();
			const parsers = new Map();
			const adapters = new Map();
			const writers = new Map();
			const plugin = {} as unknown as IEventRegistryDependencies['plugin'];

			const deps: IEventRegistryDependencies = {
				bus,
				indexes,
				parsers,
				adapters,
				writers,
				plugin,
			};

			const handler = new ConcreteHandler(deps);

			expect(handler['_bus']).toBe(bus);
			expect(handler['_indexers']).toBe(indexes);
			expect(handler['_parsers']).toBe(parsers);
			expect(handler['_adapters']).toBe(adapters);
			expect(handler['_writers']).toBe(writers);
			expect(handler['_plugin']).toBe(plugin);
		});
	});

	describe('abstractness', () => {
		it('cannot be used directly because handle is undefined', () => {
			const deps: IEventRegistryDependencies = {
				bus: EventBus.instance,
				indexes: new Map(),
				parsers: new Map(),
				adapters: new Map(),
				writers: new Map(),
				plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			};

			const handler = new (EventHandler as unknown as new (
				deps: IEventRegistryDependencies,
			) => { handle?: (_event: unknown) => void })(deps);

			expect(handler.handle).toBeUndefined();
		});

		it('requires a concrete subclass to implement handle', () => {
			const handler = new ConcreteHandler({
				bus: EventBus.instance,
				indexes: new Map(),
				parsers: new Map(),
				adapters: new Map(),
				writers: new Map(),
				plugin: {} as unknown as IEventRegistryDependencies['plugin'],
			});

			expect(handler.handle).toBeDefined();
			expect(() => handler.handle(new TestEvent({ value: 1 }))).not.toThrow();
		});
	});
});
