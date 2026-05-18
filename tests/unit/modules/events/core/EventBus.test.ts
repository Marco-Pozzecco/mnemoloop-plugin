import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { Event } from '@/modules/events/core/Event';
import type { IEvent } from '@/interfaces/IEvent';
import { resetSingletons } from '../../../../helpers/reset-singletons';

interface TestData {
	value: number;
}

class TestEvent extends Event<TestData> {
	constructor(data: TestData) {
		super('test-event', data);
	}
}

describe('EventBus', () => {
	beforeEach(() => {
		resetSingletons();
	});

	describe('singleton', () => {
		it('should return the same instance on multiple accesses', () => {
			const bus1 = EventBus.instance;
			const bus2 = EventBus.instance;
			expect(bus1).toBe(bus2);
		});

		it('should create a new instance after reset', () => {
			const bus1 = EventBus.instance;
			resetSingletons();
			const bus2 = EventBus.instance;
			expect(bus1).not.toBe(bus2);
		});
	});

	describe('subscribe', () => {
		it('should add a subscriber and return the callback', () => {
			const bus = EventBus.instance;
			const cb = vi.fn();
			const result = bus.subscribe(cb);
			expect(result).toBe(cb);
		});
	});

	describe('unsubscribe', () => {
		it('should remove a subscriber so it no longer receives events', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			const cb = (e: IEvent) => events.push(e);
			bus.subscribe(cb);
			bus.unsubscribe(cb);
			bus.publish(new TestEvent({ value: 1 }));
			expect(events).toHaveLength(0);
		});
	});

	describe('publish', () => {
		it('should deliver events to all subscribers', () => {
			const bus = EventBus.instance;
			const events1: IEvent[] = [];
			const events2: IEvent[] = [];
			bus.subscribe((e) => events1.push(e));
			bus.subscribe((e) => events2.push(e));
			const event = new TestEvent({ value: 42 });
			bus.publish(event);
			expect(events1).toHaveLength(1);
			expect(events2).toHaveLength(1);
			expect(events1[0]).toBe(event);
		});

		it('should return the event id', () => {
			const bus = EventBus.instance;
			const event = new TestEvent({ value: 1 });
			const result = bus.publish(event);
			expect(result).toBe(event.id);
		});

		it('should not deliver to unsubscribed callbacks', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			const cb = (e: IEvent) => events.push(e);
			bus.subscribe(cb);
			bus.unsubscribe(cb);
			bus.publish(new TestEvent({ value: 1 }));
			expect(events).toHaveLength(0);
		});

		it('should synchronously execute subscribers', () => {
			const bus = EventBus.instance;
			let called = false;
			bus.subscribe(() => {
				called = true;
			});
			bus.publish(new TestEvent({ value: 1 }));
			expect(called).toBe(true);
		});
	});

	describe('request', () => {
		it('should deliver event exactly once via one-shot pattern', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			const cb = (e: IEvent) => events.push(e);
			bus.request(new TestEvent({ value: 99 }), cb);
			expect(events).toHaveLength(1);
			// After request, the callback should be unsubscribed
			bus.publish(new TestEvent({ value: 2 }));
			expect(events).toHaveLength(1);
		});
	});

	describe('error resilience', () => {
		it('should not isolate errors; remaining subscribers do not receive event', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			bus.subscribe(() => {
				throw new Error('boom');
			});
			bus.subscribe((e) => events.push(e));
			expect(() => bus.publish(new TestEvent({ value: 1 }))).toThrow('boom');
			expect(events).toHaveLength(0);
		});
	});
});
