import { describe, expect, it } from 'vitest';
import { Event } from '@/modules/events/core/Event';

interface TestData {
	value: number;
}

class TestEvent extends Event<TestData> {
	constructor(data: TestData) {
		super('test-event', data);
	}
}

describe('Event', () => {
	describe('constructor', () => {
		it('should set type and data', () => {
			const event = new TestEvent({ value: 42 });
			expect(event.type).toBe('test-event');
			expect(event.data).toEqual({ value: 42 });
		});

		it('should generate a UUID id', () => {
			const event = new TestEvent({ value: 1 });
			expect(event.id).toBeDefined();
			expect(typeof event.id).toBe('string');
			expect(event.id.length).toBeGreaterThan(0);
		});

		it('should set current time', () => {
			const before = new Date();
			const event = new TestEvent({ value: 1 });
			const after = new Date();
			expect(event.time.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(event.time.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('isType', () => {
		it('should return true for matching type', () => {
			const event = new TestEvent({ value: 1 });
			expect(event.isType('test-event')).toBe(true);
		});

		it('should return false for non-matching type', () => {
			const event = new TestEvent({ value: 1 });
			expect(event.isType('other-event')).toBe(false);
		});
	});

	describe('toJSON', () => {
		it('should serialize to JSON-friendly format', () => {
			const event = new TestEvent({ value: 42 });
			const json = event.toJSON();
			expect(json).toEqual({
				type: 'test-event',
				timestamp: event.time.toISOString(),
				data: { value: 42 },
			});
		});
	});
});
