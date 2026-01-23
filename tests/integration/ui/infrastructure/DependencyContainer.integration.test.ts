/**
 * Integration tests for DependencyContainer
 *
 * Tests the complete container setup including:
 * - All singleton registrations
 * - All transient registrations
 * - Service resolution
 * - Lifecycle behavior (singleton vs transient)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupContainer } from '@/ui/views/App/DependencyContainerSetup';
import type { App } from 'obsidian';
import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
import { EventBus, Logger } from '@/ui/infrastructure/EventBus';
import { DashboardController } from '@/ui/controllers/DashboardController';
import type { IndexManager } from '@/core/indexer';
import type { StatisticsManager } from '@/core/statistics';
import { DueQueueManager } from '@/core/srs';

// Mock Obsidian App
const mockApp = {
	vault: {
		adapter: {
			exists: vi.fn().mockResolvedValue(false),
			read: vi.fn().mockResolvedValue('{}'),
			write: vi.fn().mockResolvedValue(undefined),
			mkdir: vi.fn().mockResolvedValue(undefined),
		},
	},
	metadataCache: {},
} as unknown as App;

describe('DependencyContainer Integration', () => {
	let container: DependencyContainer;

	beforeEach(() => {
		container = setupContainer(mockApp) as DependencyContainer;
	});

	describe('container registration', () => {
		it('should create a valid container', () => {
			expect(container).toBeInstanceOf(DependencyContainer);
			expect(container.getRegistrationCount()).toBeGreaterThan(0);
		});

		it('should have all expected services registered', () => {
			const tokens = container.getRegisteredTokens();
			const tokenStrings = tokens.map((t) => (typeof t === 'symbol' ? t.toString() : t));

			// Singleton services
			expect(tokenStrings).toContain('Logger');
			expect(tokenStrings).toContain('EventBus');
			expect(tokenStrings).toContain('IndexManager');
			expect(tokenStrings).toContain('StatisticsManager');
			expect(tokenStrings).toContain('DashboardController');

			// Note: SessionStore, SettingsStore, UIStore require additional dependencies
			// They will be added when those dependencies are available
		});
	});

	describe('singleton services', () => {
		it('should resolve Logger as singleton', () => {
			const logger1 = container.resolve<Logger>('Logger');
			const logger2 = container.resolve<Logger>('Logger');

			expect(logger1).toBe(logger2);
			expect(logger1).toBeDefined();
		});

		it('should resolve EventBus as singleton', () => {
			const eventBus1 = container.resolve<EventBus>('EventBus');
			const eventBus2 = container.resolve<EventBus>('EventBus');

			expect(eventBus1).toBe(eventBus2);
			expect(eventBus1).toBeDefined();
		});

		it('should resolve IndexManager as singleton', () => {
			const indexManager1 = container.resolve<IndexManager>('IndexManager');
			const indexManager2 = container.resolve<IndexManager>('IndexManager');

			expect(indexManager1).toBe(indexManager2);
			expect(indexManager1).toHaveProperty('index');
		});

		it('should resolve StatisticsManager as singleton', () => {
			const statsManager1 = container.resolve<StatisticsManager>('StatisticsManager');
			const statsManager2 = container.resolve<StatisticsManager>('StatisticsManager');

			expect(statsManager1).toBe(statsManager2);
			expect(statsManager1).toHaveProperty('statistics');
		});
	});

	describe('transient services', () => {
		it('should resolve DashboardController as transient (new instance each time)', () => {
			const controller1 = container.resolve<DashboardController>('DashboardController');
			const controller2 = container.resolve<DashboardController>('DashboardController');

			expect(controller1).not.toBe(controller2);
			expect(controller1).toBeDefined();
			expect(controller2).toBeDefined();
		});

		// Note: SessionStore, SettingsStore, UIStore require additional dependencies
		// These tests will be added when those dependencies are available
	});

	describe('dependency injection', () => {
		it('should inject dependencies into DashboardController', () => {
			const controller = container.resolve<DashboardController>('DashboardController');

			// Verify controller was created successfully
			expect(controller).toBeDefined();

			// Verify dependencies are accessible
			expect(controller['logger']).toBeDefined();
			expect(controller['eventBus']).toBeDefined();
			expect(controller['indexManager']).toHaveProperty('index');
			expect(controller['statisticsManager']).toHaveProperty('statistics');
		});

		it('should inject same singleton instances into controllers', () => {
			const controller1 = container.resolve<DashboardController>('DashboardController');
			const controller2 = container.resolve<DashboardController>('DashboardController');

			const logger = container.resolve<Logger>('Logger');
			const eventBus = container.resolve<EventBus>('EventBus');
			const indexManager = container.resolve<IndexManager>('IndexManager');
			const statsManager = container.resolve<StatisticsManager>('StatisticsManager');

			// Both controllers should receive same singleton instances
			expect(controller1['logger']).toBe(logger);
			expect(controller2['logger']).toBe(logger);
			expect(controller1['eventBus']).toBe(eventBus);
			expect(controller2['eventBus']).toBe(eventBus);
			expect(controller1['indexManager']).toBe(indexManager);
			expect(controller2['indexManager']).toBe(indexManager);
			expect(controller1['statisticsManager']).toBe(statsManager);
			expect(controller2['statisticsManager']).toBe(statsManager);
		});
	});

	describe('container lifecycle', () => {
		it('should support clearing all registrations', () => {
			const initialCount = container.getRegistrationCount();

			container.clear();

			expect(container.getRegistrationCount()).toBe(0);
		});

		it('should allow checking if service is registered', () => {
			expect(container.has('Logger')).toBe(true);
			expect(container.has('EventBus')).toBe(true);
			expect(container.has('DashboardController')).toBe(true);
			expect(container.has('NonExistentService')).toBe(false);
		});

		it('should throw error when resolving unregistered service', () => {
			expect(() => {
				container.resolve('NonExistentService');
			}).toThrow('Dependency not found');
		});
	});

	describe('error handling', () => {
		it('should handle multiple container instances', () => {
			const container1 = setupContainer(mockApp) as DependencyContainer;
			const container2 = setupContainer(mockApp) as DependencyContainer;

			const logger1 = container1.resolve<Logger>('Logger');
			const logger2 = container2.resolve<Logger>('Logger');

			// Different containers should have different singleton instances
			expect(logger1).not.toBe(logger2);

			// Same container should return same instance
			const logger1Again = container1.resolve<Logger>('Logger');
			expect(logger1).toBe(logger1Again);
		});

		it('should throw error when registering duplicate services', () => {
			expect(() => {
				container.registerSingleton('Logger', () => new Logger('Duplicate'));
			}).toThrow('Service already registered');
		});
	});

	describe('setupContainer function', () => {
		it('should return a properly configured container', () => {
			const newContainer = setupContainer(mockApp);

			expect(newContainer).toBeInstanceOf(DependencyContainer);
			expect(newContainer.getRegistrationCount()).toBeGreaterThan(0);
		});
	});
});
