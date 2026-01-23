/**
 * Unit tests for ManagersContext
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/utils/Logger';

// Mock svelte module before importing ManagersContext
vi.mock('svelte', () => ({
	setContext: vi.fn(),
	getContext: vi.fn(),
}));

import { setManagersContext, getManagersContext, hasManagersContext, useManager, useService, tryResolve } from '@/ui/infrastructure/ManagersContext';
import { setContext, getContext } from 'svelte';

describe('ManagersContext', () => {
	let container: DependencyContainer;
	let mockLogger: Logger;
	let mockEventBus: EventBus;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock services
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as Logger;

		mockEventBus = new EventBus();

		// Create and configure container
		container = new DependencyContainer();
		container.registerSingleton('Logger', () => mockLogger);
		container.registerSingleton('EventBus', () => mockEventBus);
	});

	describe('setManagersContext', () => {
		it('should set dependency container in Svelte context', () => {
			setManagersContext(container);

			expect(setContext).toHaveBeenCalledTimes(1);
			expect(setContext).toHaveBeenCalledWith(expect.any(Symbol), container);
		});
	});

	describe('getManagersContext', () => {
		it('should return dependency container from context', () => {
			vi.mocked(getContext).mockReturnValue(container);

			const result = getManagersContext();

			expect(result).toBe(container);
			expect(getContext).toHaveBeenCalledWith(expect.any(Symbol));
		});

		it('should throw error when context is not found', () => {
			vi.mocked(getContext).mockReturnValue(undefined);

			expect(() => getManagersContext()).toThrow(
				'ManagersContext not found. Did you forget to call setManagersContext in a parent component?'
			);
		});

		it('should return same container instance on multiple calls', () => {
			vi.mocked(getContext).mockReturnValue(container);

			const result1 = getManagersContext();
			const result2 = getManagersContext();

			expect(result1).toBe(result2);
		});
	});

	describe('hasManagersContext', () => {
		it('should return true when context is available', () => {
			vi.mocked(getContext).mockReturnValue(container);

			const result = hasManagersContext();

			expect(result).toBe(true);
		});

		it('should return false when context is not available', () => {
			vi.mocked(getContext).mockReturnValue(undefined);

			const result = hasManagersContext();

			expect(result).toBe(false);
		});

		it('should handle errors gracefully', () => {
			vi.mocked(getContext).mockImplementation(() => {
				throw new Error('Context not in component tree');
			});

			const result = hasManagersContext();

			expect(result).toBe(false);
		});
	});

	describe('useManager', () => {
		beforeEach(() => {
			setManagersContext(container);
			vi.mocked(getContext).mockReturnValue(container);
		});

		it('should resolve a manager dependency', () => {
			const logger = useManager<Logger>('Logger');

			expect(logger).toBe(mockLogger);
		});

		it('should throw error when manager is not registered', () => {
			expect(() => useManager('NonExistentManager')).toThrow(
				'Dependency not found: NonExistentManager'
			);
		});

		it('should resolve same singleton instance on multiple calls', () => {
			const logger1 = useManager<Logger>('Logger');
			const logger2 = useManager<Logger>('Logger');

			expect(logger1).toBe(logger2);
		});

		it('should support type-safe resolution', () => {
			const logger = useManager<Logger>('Logger');

			// TypeScript should enforce type
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.error).toBe('function');
		});
	});

	describe('useService', () => {
		beforeEach(() => {
			setManagersContext(container);
			vi.mocked(getContext).mockReturnValue(container);
		});

		it('should resolve a service dependency', () => {
			const eventBus = useService<EventBus>('EventBus');

			expect(eventBus).toBe(mockEventBus);
		});

		it('should throw error when service is not registered', () => {
			expect(() => useService('NonExistentService')).toThrow(
				'Dependency not found: NonExistentService'
			);
		});

		it('should resolve same singleton instance on multiple calls', () => {
			const eventBus1 = useService<EventBus>('EventBus');
			const eventBus2 = useService<EventBus>('EventBus');

			expect(eventBus1).toBe(eventBus2);
		});

		it('should support type-safe resolution', () => {
			const eventBus = useService<EventBus>('EventBus');

			// TypeScript should enforce type
			expect(typeof eventBus.on).toBe('function');
			expect(typeof eventBus.emit).toBe('function');
			expect(typeof eventBus.clear).toBe('function');
		});
	});

	describe('tryResolve', () => {
		beforeEach(() => {
			setManagersContext(container);
			vi.mocked(getContext).mockReturnValue(container);
		});

		it('should resolve a service when available', () => {
			const result = tryResolve<Logger>('Logger');

			expect(result).toBe(mockLogger);
		});

		it('should return undefined when service is not registered', () => {
			const result = tryResolve('NonExistentService');

			expect(result).toBeUndefined();
		});

		it('should return undefined when context is not available', () => {
			vi.mocked(getContext).mockReturnValue(undefined);

			const result = tryResolve<Logger>('Logger');

			expect(result).toBeUndefined();
		});

		it('should handle errors gracefully', () => {
			vi.mocked(getContext).mockImplementation(() => {
				throw new Error('Context not in component tree');
			});

			const result = tryResolve<Logger>('Logger');

			expect(result).toBeUndefined();
		});
	});
});
