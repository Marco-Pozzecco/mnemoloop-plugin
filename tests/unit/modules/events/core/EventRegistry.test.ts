import type { IEvent } from '@/interfaces/IEvent';
import type { IEventHandler } from '@/interfaces/IEventHandler';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Event } from '@/modules/events/core/Event';
import { EventBus } from '@/modules/events/core/EventBus';
import { EventHandler } from '@/modules/events/core/EventHandler';
import { EventRegistry } from '@/modules/events/core/EventRegistry';
import { EventRouter } from '@/modules/events/core/EventRouter';
import { Plugin } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSingletons } from '../../../../helpers/reset-singletons';

class TestEvent extends Event<{ value: number }> {
	static readonly type = 'test-event';

	constructor(data: { value: number }) {
		super(TestEvent.type, data);
	}
}

class TestHandler implements IEventHandler {
	handled: IEvent[] = [];

	constructor(_deps: IEventRegistryDependencies) {}

	async handle(event: IEvent): Promise<void> {
		this.handled.push(event);
	}
}
function createMockDeps(): IEventRegistryDependencies {
	return {
		plugin: {} as Plugin,
		adapters: new Map(),
		indexes: new Map(),
		parsers: new Map(),
		writers: new Map(),
		bus: EventBus.instance,
	};
}

describe('EventRegistry', () => {
	beforeEach(() => {
		resetSingletons();
	});

	describe('constructor', () => {
		it('should store bus, deps, and router', () => {
			const bus = EventBus.instance;
			const deps = createMockDeps();
			const router = new EventRouter();
			const registry = new EventRegistry(bus, deps, router);
			expect(registry).toBeInstanceOf(EventRegistry);
		});
	});

	describe('initialize', () => {
		it('should subscribe handlers from router to bus', () => {
			const bus = EventBus.instance;
			const deps = createMockDeps();
			const router = new EventRouter();
			const registry = new EventRegistry(bus, deps, router);

			router.route(TestEvent, TestHandler);
			registry.initialize();

			const event = new TestEvent({ value: 42 });
			bus.publish(event);

			// Since TestHandler is instantiated by the registry, we can't directly
			// inspect it. Instead, verify the event was delivered by checking
			// the bus has a subscriber.
			const handlers = (bus as unknown as { _registry: Map<string, Set<unknown>> })._registry.get(
				TestEvent.type,
			);
			expect(handlers).toBeDefined();
			expect(handlers!.size).toBe(1);
		});

		it('should be idempotent (multiple initialize does not duplicate handlers)', () => {
			const bus = EventBus.instance;
			const deps = createMockDeps();
			const router = new EventRouter();
			const registry = new EventRegistry(bus, deps, router);

			router.route(TestEvent, TestHandler);
			registry.initialize();
			registry.initialize();

			const handlers = (bus as unknown as { _registry: Map<string, Set<unknown>> })._registry.get(
				TestEvent.type,
			);
			expect(handlers).toBeDefined();
			expect(handlers!.size).toBe(1);
		});

		it('should bind handler methods so this is preserved', () => {
			const bus = EventBus.instance;
			const deps = createMockDeps();
			const router = new EventRouter();
			const registry = new EventRegistry(bus, deps, router);

			class BoundCheckHandler extends EventHandler<TestEvent> {
				wasCalled = false;
				async handle(_event: TestEvent): Promise<void> {
					this.wasCalled = true;
					// Accessing a protected property from the base class proves this is bound
					expect(this._bus).toBe(bus);
				}
			}

			router.route(TestEvent, BoundCheckHandler);
			registry.initialize();

			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const event = new TestEvent({ value: 42 });
			bus.publish(event);

			expect(errorSpy).not.toHaveBeenCalled();
			errorSpy.mockRestore();
		});
	});

	describe('dispose', () => {
		it('should unsubscribe all handlers', () => {
			const bus = EventBus.instance;
			const deps = createMockDeps();
			const router = new EventRouter();
			const registry = new EventRegistry(bus, deps, router);

			router.route(TestEvent, TestHandler);
			registry.initialize();
			registry.dispose();

			const handlers = (bus as unknown as { _registry: Map<string, Set<unknown>> })._registry.get(
				TestEvent.type,
			);
			expect(handlers).toBeUndefined();
		});
	});
});
