/**
 * Unit tests for EventBus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, AppEvents, type AppEventName } from '@/ui/infrastructure/EventBus';

describe('EventBus', () => {
	let eventBus: EventBus;

	beforeEach(() => {
		eventBus = new EventBus();
	});

	describe('on and off', () => {
		it('should register an event listener', () => {
			const handler = vi.fn();
			eventBus.on('test-event', handler);

			eventBus.emit('test-event', 'data');

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith('data');
		});

		it('should return an unsubscribe function', () => {
			const handler = vi.fn();
			const unsubscribe = eventBus.on('test-event', handler);

			expect(typeof unsubscribe).toBe('function');
		});

		it('should unregister an event listener using unsubscribe', () => {
			const handler = vi.fn();
			const unsubscribe = eventBus.on('test-event', handler);

			eventBus.emit('test-event', 'data');
			expect(handler).toHaveBeenCalledTimes(1);

			unsubscribe();

			eventBus.emit('test-event', 'data');
			expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
		});

		it('should unregister an event listener using off', () => {
			const handler = vi.fn();
			eventBus.on('test-event', handler);

			eventBus.emit('test-event', 'data');
			expect(handler).toHaveBeenCalledTimes(1);

			eventBus.off('test-event', handler);

			eventBus.emit('test-event', 'data');
			expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
		});

		it('should support multiple listeners for the same event', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			const handler3 = vi.fn();

			eventBus.on('test-event', handler1);
			eventBus.on('test-event', handler2);
			eventBus.on('test-event', handler3);

			eventBus.emit('test-event', 'data');

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler3).toHaveBeenCalledTimes(1);
		});

		it('should support listeners for different events', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			eventBus.on('event-1', handler1);
			eventBus.on('event-2', handler2);

			eventBus.emit('event-1', 'data1');
			eventBus.emit('event-2', 'data2');

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler1).toHaveBeenCalledWith('data1');
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledWith('data2');
		});

		it('should call handler with event data', () => {
			const handler = vi.fn();
			const testData = { id: 123, name: 'test' };

			eventBus.on('test-event', handler);
			eventBus.emit('test-event', testData);

			expect(handler).toHaveBeenCalledWith(testData);
		});

		it('should emit event with no data', () => {
			const handler = vi.fn();

			eventBus.on('test-event', handler);
			eventBus.emit('test-event');

			expect(handler).toHaveBeenCalledWith(undefined);
		});
	});

	describe('emit', () => {
		it('should call all registered listeners', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			eventBus.on('test-event', handler1);
			eventBus.on('test-event', handler2);

			eventBus.emit('test-event', 'data');

			expect(handler1).toHaveBeenCalledWith('data');
			expect(handler2).toHaveBeenCalledWith('data');
		});

		it('should not throw when no listeners are registered', () => {
			expect(() => {
				eventBus.emit('non-existent-event', 'data');
			}).not.toThrow();
		});

		it('should handle errors in listeners without affecting other listeners', () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const handler1 = vi.fn(() => {
				throw new Error('Handler 1 failed');
			});
			const handler2 = vi.fn();

			eventBus.on('test-event', handler1);
			eventBus.on('test-event', handler2);

			eventBus.emit('test-event', 'data');

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("Error in event handler for 'test-event'"),
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('clear', () => {
		it('should remove all listeners', () => {
			const handler = vi.fn();

			eventBus.on('event-1', handler);
			eventBus.on('event-2', handler);

			eventBus.clear();

			eventBus.emit('event-1', 'data');
			eventBus.emit('event-2', 'data');

			expect(handler).not.toHaveBeenCalled();
		});

		it('should clear all events', () => {
			eventBus.on('event-1', vi.fn());
			eventBus.on('event-2', vi.fn());

			expect(eventBus.getRegisteredEvents()).toHaveLength(2);

			eventBus.clear();

			expect(eventBus.getRegisteredEvents()).toHaveLength(0);
		});
	});

	describe('getListenerCount', () => {
		it('should return 0 for events with no listeners', () => {
			expect(eventBus.getListenerCount('non-existent')).toBe(0);
		});

		it('should return the correct listener count', () => {
			eventBus.on('test-event', vi.fn());
			eventBus.on('test-event', vi.fn());
			eventBus.on('test-event', vi.fn());

			expect(eventBus.getListenerCount('test-event')).toBe(3);
		});
	});

	describe('hasListeners', () => {
		it('should return false for events with no listeners', () => {
			expect(eventBus.hasListeners('non-existent')).toBe(false);
		});

		it('should return true for events with listeners', () => {
			eventBus.on('test-event', vi.fn());
			expect(eventBus.hasListeners('test-event')).toBe(true);
		});

		it('should return false after removing all listeners', () => {
			const handler = vi.fn();
			eventBus.on('test-event', handler);
			eventBus.off('test-event', handler);

			expect(eventBus.hasListeners('test-event')).toBe(false);
		});
	});

	describe('getRegisteredEvents', () => {
		it('should return empty array when no events are registered', () => {
			expect(eventBus.getRegisteredEvents()).toEqual([]);
		});

		it('should return all registered event names', () => {
			eventBus.on('event-1', vi.fn());
			eventBus.on('event-2', vi.fn());
			eventBus.on('event-3', vi.fn());

			const events = eventBus.getRegisteredEvents();
			expect(events).toHaveLength(3);
			expect(events).toContain('event-1');
			expect(events).toContain('event-2');
			expect(events).toContain('event-3');
		});
	});

	describe('once', () => {
		it('should call handler only once', () => {
			const handler = vi.fn();
			eventBus.once('test-event', handler);

			eventBus.emit('test-event', 'data1');
			eventBus.emit('test-event', 'data2');
			eventBus.emit('test-event', 'data3');

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith('data1');
		});

		it('should return unsubscribe function', () => {
			const handler = vi.fn();
			const unsubscribe = eventBus.once('test-event', handler);

			expect(typeof unsubscribe).toBe('function');

			// Calling unsubscribe before first emit should prevent handler from being called
			unsubscribe();
			eventBus.emit('test-event', 'data');

			expect(handler).not.toHaveBeenCalled();
		});

		it('should work with other listeners', () => {
			const onceHandler = vi.fn();
			const regularHandler = vi.fn();

			eventBus.once('test-event', onceHandler);
			eventBus.on('test-event', regularHandler);

			eventBus.emit('test-event', 'data1');
			eventBus.emit('test-event', 'data2');

			expect(onceHandler).toHaveBeenCalledTimes(1);
			expect(regularHandler).toHaveBeenCalledTimes(2);
		});
	});

	describe('AppEvents', () => {
		it('should define all expected events', () => {
			expect(AppEvents.SESSION_STARTED).toBe('session:started');
			expect(AppEvents.SESSION_COMPLETED).toBe('session:completed');
			expect(AppEvents.SETTINGS_UPDATED).toBe('settings:updated');
			expect(AppEvents.CARD_RATED).toBe('card:rated');
			expect(AppEvents.THEME_CHANGED).toBe('ui:theme-changed');
		});

		it('should work with AppEvents constants', () => {
			const handler = vi.fn();

			eventBus.on(AppEvents.SESSION_STARTED, handler);
			eventBus.emit(AppEvents.SESSION_STARTED, { id: '123' });

			expect(handler).toHaveBeenCalledWith({ id: '123' });
		});
	});

	describe('type safety', () => {
		it('should support typed event handlers', () => {
			interface SessionData {
				id: string;
				startTime: number;
			}

			const handler = vi.fn((data: SessionData) => {
				expect(data.id).toBe('123');
				expect(data.startTime).toBe(1234567890);
			});

			eventBus.on<SessionData>('session-event', handler);
			eventBus.emit('session-event', { id: '123', startTime: 1234567890 });

			expect(handler).toHaveBeenCalledTimes(1);
		});
	});
});
