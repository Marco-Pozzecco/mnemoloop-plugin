import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventBus } from '@/modules/events/core/EventBus';
import { Event } from '@/modules/events/core/Event';
import type { IEvent } from '@/interfaces/IEvent';
import { resetSingletons } from '../../../../helpers/reset-singletons';

interface TestData {
	value: number;
}

class TestEvent extends Event<TestData> {
	static readonly type = 'test-event';

	constructor(data: TestData) {
		super(TestEvent.type, data);
	}
}

class OtherEvent extends Event<{ value: number }> {
	static readonly type = 'other-event';

	constructor(data: { value: number }) {
		super(OtherEvent.type, data);
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
		it('should add a subscriber and return unsubscribe function', () => {
			const bus = EventBus.instance;
			const cb = vi.fn();
			const unsubscribe = bus.subscribe(TestEvent, cb);
			expect(typeof unsubscribe).toBe('function');
		});
	});

	describe('unsubscribe', () => {
		it('should remove a subscriber so it no longer receives events', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			const cb = (e: IEvent) => {
				events.push(e);
			};
			bus.subscribe(TestEvent, cb);
			bus.unsubscribe(TestEvent, cb);
			bus.publish(new TestEvent({ value: 1 }));
			expect(events).toHaveLength(0);
		});
	});

	describe('publish', () => {
		it('should deliver events to all subscribers', () => {
			const bus = EventBus.instance;
			const events1: IEvent[] = [];
			const events2: IEvent[] = [];
			bus.subscribe(TestEvent, (e) => {
				events1.push(e);
			});
			bus.subscribe(TestEvent, (e) => {
				events2.push(e);
			});
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
			const cb = (e: IEvent) => {
				events.push(e);
			};
			bus.subscribe(TestEvent, cb);
			bus.unsubscribe(TestEvent, cb);
			bus.publish(new TestEvent({ value: 1 }));
			expect(events).toHaveLength(0);
		});

		it('should synchronously execute subscribers', () => {
			const bus = EventBus.instance;
			let called = false;
			bus.subscribe(TestEvent, () => {
				called = true;
			});
			bus.publish(new TestEvent({ value: 1 }));
			expect(called).toBe(true);
		});

		it('should not deliver events to subscribers of different types', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			bus.subscribe(OtherEvent, (e) => {
				events.push(e);
			});
			bus.publish(new TestEvent({ value: 1 }));
			expect(events).toHaveLength(0);
		});
	});

	describe('subscribeOnce', () => {
		it('should deliver event exactly once', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			const cb = (e: IEvent) => {
				events.push(e);
			};
			bus.subscribeOnce(TestEvent, cb);
			bus.publish(new TestEvent({ value: 1 }));
			bus.publish(new TestEvent({ value: 2 }));
			expect(events).toHaveLength(1);
		});
	});

	describe('error resilience', () => {
		it('should catch errors and continue delivering to other subscribers', () => {
			const bus = EventBus.instance;
			const events: IEvent[] = [];
			bus.subscribe(TestEvent, () => {
				throw new Error('boom');
			});
			bus.subscribe(TestEvent, (e) => {
				events.push(e);
			});
			expect(() => bus.publish(new TestEvent({ value: 1 }))).not.toThrow();
			expect(events).toHaveLength(1);
		});
	});
});
