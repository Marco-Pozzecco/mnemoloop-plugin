import type { EventClass, IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Event } from '@/modules/events/core/Event';
import { EventBus } from '@/modules/events/core/EventBus';
import { EventHandler } from '@/modules/events/core/EventHandler';
import { EventRouter } from '@/modules/events/core/EventRouter';
import { describe, expect, it } from 'vitest';

interface TestPayload {
	value: number;
}

class TestEvent extends Event<TestPayload> {
	static readonly type = 'test-event';

	constructor(data: TestPayload) {
		super(TestEvent.type, data);
	}
}

class OtherEvent extends Event<{ value: string }> {
	static readonly type = 'other-event';

	constructor(data: { value: string }) {
		super(OtherEvent.type, data);
	}
}

class TestHandler extends EventHandler<TestEvent> {
	async handle(_event: TestEvent): Promise<void> {
		/* no-op */
	}
}

class OtherHandler extends EventHandler<OtherEvent> {
	async handle(_event: OtherEvent): Promise<void> {
		/* no-op */
	}
}

class AnotherHandler extends EventHandler<TestEvent> {
	async handle(_event: TestEvent): Promise<void> {
		/* no-op */
	}
}

function createMockDeps(): IEventRegistryDependencies {
	return {
		plugin: {} as unknown as IEventRegistryDependencies['plugin'],
		adapters: {} as unknown as IEventRegistryDependencies['adapters'],
		indexes: {} as unknown as IEventRegistryDependencies['indexes'],
		parsers: {} as unknown as IEventRegistryDependencies['parsers'],
		writers: {} as unknown as IEventRegistryDependencies['writers'],
		bus: EventBus.instance,
	};
}

describe('EventRouter', () => {
	describe('route', () => {
		it('should add an event to handler mapping', () => {
			const router = new EventRouter();
			const handler = TestHandler;

			router.route(TestEvent, handler);

			expect(router.routes.has(TestEvent as unknown as EventClass<unknown>)).toBe(true);
			expect(router.routes.get(TestEvent as unknown as EventClass<unknown>)).toContain(handler);
		});

		it('should store multiple handlers for the same event', () => {
			const router = new EventRouter();

			router.route(TestEvent, TestHandler);
			router.route(TestEvent, AnotherHandler);

			const handlers = router.routes.get(TestEvent as unknown as EventClass<unknown>);
			expect(handlers).toBeInstanceOf(Set);
			expect(handlers!.size).toBe(2);
			expect(handlers).toContain(TestHandler);
			expect(handlers).toContain(AnotherHandler);
		});

		it('should not add duplicate handlers for the same event', () => {
			const router = new EventRouter();

			router.route(TestEvent, TestHandler);
			router.route(TestEvent, TestHandler);

			const handlers = router.routes.get(TestEvent as unknown as EventClass<unknown>);
			expect(handlers!.size).toBe(1);
			expect(handlers).toContain(TestHandler);
		});

		it('should store handlers for different events independently', () => {
			const router = new EventRouter();

			router.route(TestEvent, TestHandler);
			router.route(OtherEvent, OtherHandler);

			expect(router.routes.get(TestEvent as unknown as EventClass<unknown>)).toContain(TestHandler);
			expect(router.routes.get(OtherEvent as unknown as EventClass<unknown>)).toContain(
				OtherHandler,
			);
		});
	});

	describe('combine', () => {
		it('should merge routes from another router', () => {
			const routerA = new EventRouter();
			const routerB = new EventRouter();

			routerA.route(TestEvent, TestHandler);
			routerB.route(OtherEvent, OtherHandler);

			const combined = routerA.combine(routerB);

			expect(combined.routes.get(TestEvent as unknown as EventClass<unknown>)).toContain(
				TestHandler,
			);
			expect(combined.routes.get(OtherEvent as unknown as EventClass<unknown>)).toContain(
				OtherHandler,
			);
		});

		it('should merge multiple routers', () => {
			const routerA = new EventRouter();
			const routerB = new EventRouter();
			const routerC = new EventRouter();

			routerA.route(TestEvent, TestHandler);
			routerB.route(OtherEvent, OtherHandler);
			routerC.route(TestEvent, AnotherHandler);

			const combined = routerA.combine(routerB, routerC);

			const testHandlers = combined.routes.get(TestEvent as unknown as EventClass<unknown>);
			expect(testHandlers!.size).toBe(2);
			expect(testHandlers).toContain(TestHandler);
			expect(testHandlers).toContain(AnotherHandler);

			expect(combined.routes.get(OtherEvent as unknown as EventClass<unknown>)).toContain(
				OtherHandler,
			);
		});

		it('should deduplicate handlers when merging', () => {
			const routerA = new EventRouter();
			const routerB = new EventRouter();

			routerA.route(TestEvent, TestHandler);
			routerB.route(TestEvent, TestHandler);

			const combined = routerA.combine(routerB);

			const handlers = combined.routes.get(TestEvent as unknown as EventClass<unknown>);
			expect(handlers!.size).toBe(1);
			expect(handlers).toContain(TestHandler);
		});

		it('should return the same router instance (fluent)', () => {
			const router = new EventRouter();
			const other = new EventRouter();

			const result = router.combine(other);

			expect(result).toBe(router);
		});
	});

	describe('constructor', () => {
		it('should start with an empty routes map', () => {
			const router = new EventRouter();

			expect(router.routes.size).toBe(0);
		});
	});

	describe('mock handler instantiation', () => {
		it('should create a handler with the mocked dependencies', () => {
			const deps = createMockDeps();
			const handler = new TestHandler(deps);

			expect(handler).toBeInstanceOf(EventHandler);
			expect(handler).toBeInstanceOf(TestHandler);
		});
	});
});
