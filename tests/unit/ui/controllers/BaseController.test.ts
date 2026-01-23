/**
 * Unit tests for BaseController
 */

import { describe, it, expect, vi } from 'vitest';
import { BaseController } from '@/ui/controllers/BaseController';
import type { Logger } from '@/ui/infrastructure/Logger';

// Mock Logger implementation
class MockLogger implements Logger {
	constructor(private prefix: string, private correlationId?: string) {}

	debug(...args: unknown[]): void {
		// Mock implementation
	}

	info(...args: unknown[]): void {
		// Mock implementation
	}

	warn(...args: unknown[]): void {
		// Mock implementation
	}

	error(...args: unknown[]): void {
		// Mock implementation
	}

	isDebugEnabled(): boolean {
		return false;
	}

	getCorrelationId(): string {
		return this.correlationId ?? 'mock-id';
	}
}

// Concrete implementation of BaseController for testing
class TestController extends BaseController {
	constructor(logger: Logger, private value: string = 'test') {
		super(logger);
	}

	async initialize(): Promise<void> {
		this.logger.info('TestController initialized');
	}

	async dispose(): Promise<void> {
		this.logger.info('TestController disposed');
	}

	async getValue(): Promise<string> {
		return this.value;
	}

	async getNumber(): Promise<number> {
		return 42;
	}

	getSyncValue(): string {
		return this.value;
	}
}

describe('BaseController', () => {
	let logger: MockLogger;
	let controller: TestController;

	beforeEach(() => {
		logger = new MockLogger('TestController', 'test-correlation-id');
		controller = new TestController(logger);
	});

	describe('construction', () => {
		it('should create a controller with a logger', () => {
			expect(controller).toBeDefined();
			expect(controller['logger']).toBe(logger);
		});

		it('should accept additional constructor parameters', () => {
			const customController = new TestController(logger, 'custom-value');
			expect(customController).toBeDefined();
		});
	});

	describe('abstract methods', () => {
		it('should require initialize to be implemented', () => {
			// This is a compile-time check - TestController implements it
			expect(async () => await controller.initialize()).not.toThrow();
		});

		it('should require dispose to be implemented', () => {
			// This is a compile-time check - TestController implements it
			expect(async () => await controller.dispose()).not.toThrow();
		});
	});

	describe('initialize', () => {
		it('should call initialize method', async () => {
			const infoSpy = vi.spyOn(logger, 'info');
			await controller.initialize();

			expect(infoSpy).toHaveBeenCalledWith('TestController initialized');
		});
	});

	describe('dispose', () => {
		it('should call dispose method', async () => {
			const infoSpy = vi.spyOn(logger, 'info');
			await controller.dispose();

			expect(infoSpy).toHaveBeenCalledWith('TestController disposed');
		});
	});

	describe('executeWithErrorHandling', () => {
		it('should execute the function and return its result', async () => {
			const result = await controller.executeWithErrorHandling('test operation', async () => {
				return 'success';
			});

			expect(result).toBe('success');
		});

		it('should return the result of async operations', async () => {
			const value = await controller.getValue();
			expect(value).toBe('test');
		});

		it('should return null on error and log the error', async () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			const result = await controller.executeWithErrorHandling('failing operation', async () => {
				throw new Error('Test error');
			});

			expect(result).toBeNull();
			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('failing operation failed:'),
				expect.any(Error)
			);
		});

		it('should log error with operation name', async () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			await controller.executeWithErrorHandling('My Custom Operation', async () => {
				throw new Error('Test error');
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('My Custom Operation failed:'),
				expect.any(Error)
			);
		});

		it('should pass error details to logger', async () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
			const testError = new Error('Detailed error message');

			await controller.executeWithErrorHandling('operation', async () => {
				throw testError;
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('operation failed:'),
				testError
			);
		});

		it('should handle multiple successful operations', async () => {
			const result1 = await controller.executeWithErrorHandling('op1', async () => 'result1');
			const result2 = await controller.executeWithErrorHandling('op2', async () => 'result2');
			const result3 = await controller.executeWithErrorHandling('op3', async () => 42);

			expect(result1).toBe('result1');
			expect(result2).toBe('result2');
			expect(result3).toBe(42);
		});

		it('should handle multiple operations with mixed success/failure', async () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			const result1 = await controller.executeWithErrorHandling('op1', async () => 'success');
			const result2 = await controller.executeWithErrorHandling('op2', async () => {
				throw new Error('failed');
			});
			const result3 = await controller.executeWithErrorHandling('op3', async () => 'success2');

			expect(result1).toBe('success');
			expect(result2).toBeNull();
			expect(result3).toBe('success2');
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('executeSyncWithErrorHandling', () => {
		it('should execute synchronous function and return its result', () => {
			const result = controller.executeSyncWithErrorHandling('sync operation', () => {
				return 'sync result';
			});

			expect(result).toBe('sync result');
		});

		it('should return null on error and log the error', () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			const result = controller.executeSyncWithErrorHandling('failing sync operation', () => {
				throw new Error('Sync error');
			});

			expect(result).toBeNull();
			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('failing sync operation failed:'),
				expect.any(Error)
			);
		});

		it('should return the result of synchronous operations', () => {
			const value = controller.getSyncValue();
			expect(value).toBe('test');
		});

		it('should handle different return types', () => {
			const strResult = controller.executeSyncWithErrorHandling('op1', () => 'string');
			const numResult = controller.executeSyncWithErrorHandling('op2', () => 42);
			const boolResult = controller.executeSyncWithErrorHandling('op3', () => true);
			const objResult = controller.executeSyncWithErrorHandling('op4', () => ({ key: 'value' }));

			expect(strResult).toBe('string');
			expect(numResult).toBe(42);
			expect(boolResult).toBe(true);
			expect(objResult).toEqual({ key: 'value' });
		});

		it('should log error with operation name for sync operations', () => {
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			controller.executeSyncWithErrorHandling('Sync Operation', () => {
				throw new Error('Sync error');
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Sync Operation failed:'),
				expect.any(Error)
			);
		});
	});

	describe('lifecycle with error handling', () => {
		it('should be able to use executeWithErrorHandling in initialize', async () => {
			class InitializingController extends BaseController {
				private data: string = '';

				constructor(logger: Logger) {
					super(logger);
				}

				async initialize(): Promise<void> {
					const result = await this.executeWithErrorHandling('Loading data', async () => {
						return 'loaded-data';
					});

					if (result !== null) {
						this.data = result;
					}
				}

				async dispose(): Promise<void> {
					// Cleanup
				}

				getData(): string {
					return this.data;
				}
			}

			const initController = new InitializingController(logger);
			await initController.initialize();

			expect(initController.getData()).toBe('loaded-data');
		});
	});

	describe('multiple controllers', () => {
		it('should support creating multiple controller instances', () => {
			const controller1 = new TestController(logger, 'controller1');
			const controller2 = new TestController(logger, 'controller2');

			expect(controller1).toBeDefined();
			expect(controller2).toBeDefined();
		});
	});
});
