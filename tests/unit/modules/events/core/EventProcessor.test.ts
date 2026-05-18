import { describe, expect, it, beforeEach } from 'vitest';
import { EventProcessor } from '@/modules/events/core/EventProcessor';
import { EventBus } from '@/modules/events/core/EventBus';
import { Event } from '@/modules/events/core/Event';
import type { IEvent } from '@/interfaces/IEvent';
import { resetSingletons } from '../../../../helpers/reset-singletons';

class TestEvent extends Event<{ value: number }> {
	constructor(data: { value: number }) {
		super('test-event', data);
	}
}

class OtherEvent extends Event<{ value: number }> {
	constructor(data: { value: number }) {
		super('other-event', data);
	}
}

class TestProcessor extends EventProcessor {
	protected readonly eventTypes = ['test-event'];
	processed: IEvent[] = [];

	process(event: IEvent): void {
		this.processed.push(event);
	}
}

describe('EventProcessor', () => {
	beforeEach(() => {
		resetSingletons();
	});

	describe('auto-subscription', () => {
		it('should receive matching events immediately after construction', () => {
			const processor = new TestProcessor();
			EventBus.instance.publish(new TestEvent({ value: 1 }));
			expect(processor.processed).toHaveLength(1);
			processor.dispose();
		});
	});

	describe('filtering', () => {
		it('should ignore events not in eventTypes', () => {
			const processor = new TestProcessor();
			EventBus.instance.publish(new OtherEvent({ value: 1 }));
			expect(processor.processed).toHaveLength(0);
			processor.dispose();
		});

		it('should process multiple matching events', () => {
			const processor = new TestProcessor();
			EventBus.instance.publish(new TestEvent({ value: 1 }));
			EventBus.instance.publish(new TestEvent({ value: 2 }));
			expect(processor.processed).toHaveLength(2);
			processor.dispose();
		});

		it('should not process events when eventTypes is empty', () => {
			class EmptyProcessor extends EventProcessor {
				protected readonly eventTypes: string[] = [];
				processed: IEvent[] = [];
				process(event: IEvent): void {
					this.processed.push(event);
				}
			}
			const processor = new EmptyProcessor();
			EventBus.instance.publish(new TestEvent({ value: 1 }));
			expect(processor.processed).toHaveLength(0);
			processor.dispose();
		});
	});

	describe('dispose', () => {
		it('should unsubscribe from EventBus', () => {
			const processor = new TestProcessor();
			processor.dispose();
			EventBus.instance.publish(new TestEvent({ value: 1 }));
			expect(processor.processed).toHaveLength(0);
		});
	});
});
