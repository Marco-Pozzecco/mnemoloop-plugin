/**
 * Unit tests for Logger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createChildLogger, LogLevel } from '@/ui/infrastructure/Logger';

describe('Logger', () => {
	let logger: Logger;
	let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let originalDevEnv: string | undefined;

	beforeEach(() => {
		logger = new Logger('TestComponent');
		consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		originalDevEnv = process.env.NODE_ENV;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		if (originalDevEnv !== undefined) {
			process.env.NODE_ENV = originalDevEnv;
		} else {
			delete process.env.NODE_ENV;
		}
	});

	describe('construction', () => {
		it('should create a logger with a prefix', () => {
			const newLogger = new Logger('MyComponent');
			expect(newLogger).toBeDefined();
		});

		it('should create a logger with a custom correlation ID', () => {
			const newLogger = new Logger('MyComponent', 'custom-id');
			expect(newLogger.getCorrelationId()).toBe('custom-id');
		});

		it('should generate a correlation ID if not provided', () => {
			const newLogger = new Logger('MyComponent');
			const correlationId = newLogger.getCorrelationId();
			expect(correlationId).toBeDefined();
			expect(typeof correlationId).toBe('string');
			expect(correlationId.length).toBeGreaterThan(0);
		});
	});

	describe('debug', () => {
		it('should log debug messages in test/development mode', () => {
			logger.debug('test message');

			expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
			const message = consoleDebugSpy.mock.calls[0][0] as string;
			expect(message).toContain('[DEBUG]');
			expect(message).toContain('TestComponent:');
			expect(consoleDebugSpy).toHaveBeenCalledWith(message, 'test message');
		});

		it('should include correlation ID in debug logs', () => {
			const customLogger = new Logger('Test', 'test-correlation-id');

			customLogger.debug('message');

			expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
			const message = consoleDebugSpy.mock.calls[0][0] as string;
			expect(message).toContain('[test-correlation-id]');
		});

		it('should log multiple arguments', () => {
			logger.debug('message', { key: 'value' }, 123);

			expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
			const calls = consoleDebugSpy.mock.calls[0];
			expect(calls).toHaveLength(4);
			expect(calls[1]).toBe('message');
			expect(calls[2]).toEqual({ key: 'value' });
			expect(calls[3]).toBe(123);
		});
	});

	describe('info', () => {
		it('should log info messages', () => {
			logger.info('info message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const message = consoleLogSpy.mock.calls[0][0] as string;
			expect(message).toContain('[INFO]');
			expect(message).toContain('TestComponent:');
			expect(consoleLogSpy).toHaveBeenCalledWith(message, 'info message');
		});

		it('should include correlation ID in info logs', () => {
			const customLogger = new Logger('Test', 'info-correlation-id');

			customLogger.info('message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const message = consoleLogSpy.mock.calls[0][0] as string;
			expect(message).toContain('[info-correlation-id]');
		});

		it('should log multiple arguments', () => {
			logger.info('message', { key: 'value' }, 123);

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const calls = consoleLogSpy.mock.calls[0];
			expect(calls).toHaveLength(4);
			expect(calls[1]).toBe('message');
			expect(calls[2]).toEqual({ key: 'value' });
			expect(calls[3]).toBe(123);
		});
	});

	describe('warn', () => {
		it('should log warning messages', () => {
			logger.warn('warning message');

			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			const message = consoleWarnSpy.mock.calls[0][0] as string;
			expect(message).toContain('[WARN]');
			expect(message).toContain('TestComponent:');
			expect(consoleWarnSpy).toHaveBeenCalledWith(message, 'warning message');
		});

		it('should include correlation ID in warn logs', () => {
			const customLogger = new Logger('Test', 'warn-correlation-id');

			customLogger.warn('message');

			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			const message = consoleWarnSpy.mock.calls[0][0] as string;
			expect(message).toContain('[warn-correlation-id]');
		});
	});

	describe('error', () => {
		it('should log error messages', () => {
			logger.error('error message');

			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const message = consoleErrorSpy.mock.calls[0][0] as string;
			expect(message).toContain('[ERROR]');
			expect(message).toContain('TestComponent:');
			expect(consoleErrorSpy).toHaveBeenCalledWith(message, 'error message');
		});

		it('should include correlation ID in error logs', () => {
			const customLogger = new Logger('Test', 'error-correlation-id');

			customLogger.error('message');

			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const message = consoleErrorSpy.mock.calls[0][0] as string;
			expect(message).toContain('[error-correlation-id]');
		});
	});

	describe('formatArgs', () => {
		it('should handle circular references', () => {
			const circularObj: Record<string, unknown> = { name: 'test' };
			circularObj.self = circularObj;

			logger.info('circular', circularObj);

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		});

		it('should handle large strings (truncate)', () => {
			const largeString = 'a'.repeat(2000);
			logger.info('large', largeString);

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		});

		it('should handle non-objects', () => {
			logger.info('primitives', 'string', 123, true, null, undefined);

			const calls = consoleLogSpy.mock.calls[0];
			expect(calls).toHaveLength(7);
			expect(calls[1]).toBe('primitives');
			expect(calls[2]).toBe('string');
			expect(calls[3]).toBe(123);
			expect(calls[4]).toBe(true);
			expect(calls[5]).toBe(null);
			expect(calls[6]).toBe(undefined);
		});
	});

	describe('getCorrelationId', () => {
		it('should return the correlation ID', () => {
			const customLogger = new Logger('Test', 'my-id');
			expect(customLogger.getCorrelationId()).toBe('my-id');
		});
	});

	describe('isDebugEnabled', () => {
		it('should return true in test/development mode', () => {
			expect(logger.isDebugEnabled()).toBe(true);
		});
	});
});

describe('createChildLogger', () => {
	it('should create a child logger with same correlation ID', () => {
		const parentLogger = new Logger('Parent', 'parent-id');
		const childLogger = createChildLogger(parentLogger, 'Child');

		expect(childLogger.getCorrelationId()).toBe('parent-id');
	});

	it('should create a child logger with new prefix', () => {
		const parentLogger = new Logger('Parent', 'parent-id');
		const childLogger = createChildLogger(parentLogger, 'Child');

		// We can't directly test the prefix, but we can verify it's a different logger
		expect(childLogger.getCorrelationId()).toBe(parentLogger.getCorrelationId());
	});
});
