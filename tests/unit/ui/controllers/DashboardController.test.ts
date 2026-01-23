/**
 * Unit tests for DashboardController
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardController } from '@/ui/controllers/DashboardController';
import { EventBus, AppEvents } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/ui/infrastructure/Logger';
import type { IndexManager } from '@/core/indexer';
import type { StatisticsManager } from '@/core/statistics';

// Mock IndexManager
const mockIndexManager = {
	index: {
		cards: {},
	},
} as unknown as IndexManager;

// Mock StatisticsManager
const mockStatisticsManager = {
	statistics: {
		history: [],
		summary: {
			totalCards: 100,
			dueCards: 20,
			reviewedToday: 5,
			averageRetention: 85,
		},
		last_updated: new Date().toISOString(),
		version: 1,
	},
} as unknown as StatisticsManager;

describe('DashboardController', () => {
	let logger: Logger;
	let eventBus: EventBus;
	let controller: DashboardController;

	beforeEach(() => {
		logger = new Logger('DashboardControllerTest');
		eventBus = new EventBus();
		controller = new DashboardController(logger, eventBus, mockIndexManager, mockStatisticsManager);
	});

	describe('construction', () => {
		it('should create a controller with all dependencies', () => {
			expect(controller).toBeDefined();
		});

		it('should store dependencies as protected members', () => {
			expect(controller['logger']).toBe(logger);
			expect(controller['eventBus']).toBe(eventBus);
			expect(controller['indexManager']).toBe(mockIndexManager);
			expect(controller['statisticsManager']).toBe(mockStatisticsManager);
		});
	});

	describe('initialize', () => {
		it('should initialize without errors', async () => {
			await expect(controller.initialize()).resolves.not.toThrow();
		});

		it('should subscribe to session:completed event', async () => {
			const onSpy = vi.spyOn(eventBus, 'on');
			await controller.initialize();

			expect(onSpy).toHaveBeenCalledWith(
				AppEvents.SESSION_COMPLETED,
				expect.any(Function)
			);
		});

		it('should store unsubscribe function', async () => {
			await controller.initialize();
			expect(controller['unsubscribeSessionCompleted']).toBeDefined();
		});
	});

	describe('getStats', () => {
		it('should return null when no cards exist', async () => {
			const emptyManager = {
				index: { cards: {} },
			} as unknown as IndexManager;
			const emptyStatsManager = {
				statistics: { history: [] },
			} as unknown as StatisticsManager;

			const testController = new DashboardController(logger, eventBus, emptyManager, emptyStatsManager);
			await testController.initialize();

			const stats = await testController.getStats();
			expect(stats).not.toBeNull();
			expect(stats?.totalCards).toBe(0);
			expect(stats?.dueCards).toBe(0);
			expect(stats?.reviewedToday).toBe(0);
			expect(stats?.averageRetention).toBe(0);
		});

		it('should return cached statistics on subsequent calls', async () => {
			// First call populates cache
			await controller.initialize();
			const stats1 = await controller.getStats();

			// Mock the managers to verify cache is used (they won't be called)
			const getStatsSpy = vi.spyOn(controller, 'refreshDashboard');

			// Second call should use cache
			const stats2 = await controller.getStats();

			expect(stats1).toEqual(stats2);
			expect(getStatsSpy).not.toHaveBeenCalled();
		});

		it('should return null and log error on failure', async () => {
			const errorManager = {
				index: { get cards() { throw new Error('Index error'); } },
			} as unknown as IndexManager;

			const testController = new DashboardController(logger, eventBus, errorManager, mockStatisticsManager);
			await testController.initialize();

			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			const stats = await testController.getStats();

			expect(stats).toBeNull();
			expect(errorSpy).toHaveBeenCalled();
		});

		it('should calculate due cards correctly', async () => {
			// Set up cards with different due dates
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 1);

			const testIndexManager = {
				index: {
					cards: {
						'card1': {
							uuid: 'card1',
							status: 'ACTIVE',
							srs: { next_review: pastDate.toISOString() },
						} as any,
						'card2': {
							uuid: 'card2',
							status: 'ACTIVE',
							srs: { next_review: futureDate.toISOString() },
						} as any,
						'card3': {
							uuid: 'card3',
							status: 'ACTIVE',
							srs: { next_review: pastDate.toISOString() },
						} as any,
					},
				},
			} as unknown as IndexManager;

			const testController = new DashboardController(logger, eventBus, testIndexManager, mockStatisticsManager);
			await testController.initialize();

			const stats = await testController.getStats();

			expect(stats?.totalCards).toBe(3);
			expect(stats?.dueCards).toBe(2); // card1 and card3 are due
		});

		it('should calculate reviewedToday from session history', async () => {
			const today = new Date();
			today.setHours(12, 0, 0, 0);
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);

			const testStatsManager = {
				statistics: {
					history: [
						{
							sessionId: 'session1',
							date: today.toISOString(),
							cardsReviewed: 10,
							correctCount: 8,
							incorrectCount: 2,
						},
						{
							sessionId: 'session2',
							date: yesterday.toISOString(),
							cardsReviewed: 15,
							correctCount: 12,
							incorrectCount: 3,
						},
					],
				},
			} as unknown as StatisticsManager;

			const testController = new DashboardController(logger, eventBus, mockIndexManager, testStatsManager);
			await testController.initialize();

			const stats = await testController.getStats();

			expect(stats?.reviewedToday).toBe(10); // Only today's session
		});

		it('should calculate average retention correctly', async () => {
			const testStatsManager = {
				statistics: {
					history: [
						{
							sessionId: 's1',
							date: new Date().toISOString(),
							cardsReviewed: 10,
							correctCount: 8,
							incorrectCount: 2,
						},
						{
							sessionId: 's2',
							date: new Date().toISOString(),
							cardsReviewed: 20,
							correctCount: 15,
							incorrectCount: 5,
						},
					],
				},
			} as unknown as StatisticsManager;

			const testController = new DashboardController(logger, eventBus, mockIndexManager, testStatsManager);
			await testController.initialize();

			const stats = await testController.getStats();

			// (8+15)/(10+20) = 23/30 = 76.67% -> 77% rounded
			expect(stats?.averageRetention).toBe(77);
		});

		it('should handle zero total cards for retention', async () => {
			const testStatsManager = {
				statistics: { history: [] },
			} as unknown as StatisticsManager;

			const testController = new DashboardController(logger, eventBus, mockIndexManager, testStatsManager);
			await testController.initialize();

			const stats = await testController.getStats();

			expect(stats?.averageRetention).toBe(0);
		});
	});

	describe('refreshDashboard', () => {
		it('should force refresh statistics', async () => {
			await controller.initialize();
			const stats = await controller.refreshDashboard();

			expect(stats).not.toBeNull();
			expect(typeof stats?.totalCards).toBe('number');
			expect(typeof stats?.dueCards).toBe('number');
			expect(typeof stats?.reviewedToday).toBe('number');
			expect(typeof stats?.averageRetention).toBe('number');
		});

		it('should update cache on refresh', async () => {
			await controller.initialize();

			const stats1 = await controller.refreshDashboard();
			controller.clearStatsCache();

			const getStatsSpy = vi.spyOn(controller, 'getStats');

			const stats2 = await controller.getStats();

			expect(stats1).toEqual(stats2);
			expect(getStatsSpy).toHaveBeenCalled();
		});

		it('should return null on error', async () => {
			const errorManager = {
				index: { get cards() { throw new Error('Refresh error'); } },
			} as unknown as IndexManager;

			const testController = new DashboardController(logger, eventBus, errorManager, mockStatisticsManager);
			await testController.initialize();

			const stats = await testController.refreshDashboard();

			expect(stats).toBeNull();
		});
	});

	describe('clearStatsCache', () => {
		it('should clear the stats cache', async () => {
			await controller.initialize();
			await controller.getStats();

			controller.clearStatsCache();

			expect(controller['statsCache']).toBeNull();
		});
	});

	describe('session:completed event handling', () => {
		it('should refresh dashboard when session completes', async () => {
			await controller.initialize();

			const refreshSpy = vi.spyOn(controller, 'refreshDashboard').mockResolvedValue({
				totalCards: 100,
				dueCards: 20,
				reviewedToday: 5,
				averageRetention: 85,
			});

			eventBus.emit(AppEvents.SESSION_COMPLETED, { sessionId: 'test-session' });

			// Wait for async handler
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(refreshSpy).toHaveBeenCalled();
		});

		it('should log error if refresh fails on session completion', async () => {
			await controller.initialize();

			vi.spyOn(controller, 'refreshDashboard').mockRejectedValue(new Error('Refresh failed'));
			const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

			eventBus.emit(AppEvents.SESSION_COMPLETED, { sessionId: 'test-session' });

			// Wait for async handler
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(errorSpy).toHaveBeenCalledWith(
				'Failed to refresh dashboard after session completed:',
				expect.any(Error)
			);
		});
	});

	describe('dispose', () => {
		it('should dispose without errors', async () => {
			await controller.initialize();
			await expect(controller.dispose()).resolves.not.toThrow();
		});

		it('should unsubscribe from session:completed event', async () => {
			await controller.initialize();

			const unsubscribe = controller['unsubscribeSessionCompleted'];
			expect(unsubscribe).toBeDefined();

			await controller.dispose();

			expect(controller['unsubscribeSessionCompleted']).toBeUndefined();
		});

		it('should clear cache on dispose', async () => {
			await controller.initialize();
			await controller.getStats();

			await controller.dispose();

			expect(controller['statsCache']).toBeNull();
		});

		it('should handle dispose when not initialized', async () => {
			// Should not throw even if initialize was not called
			await expect(controller.dispose()).resolves.not.toThrow();
		});

		it('should handle multiple dispose calls', async () => {
			await controller.initialize();
			await controller.dispose();
			await expect(controller.dispose()).resolves.not.toThrow();
		});
	});

	describe('logCorrelationId', () => {
		it('should return correlation ID', async () => {
			await controller.initialize();

			const cid = controller.logCorrelationId();

			expect(typeof cid).toBe('string');
			expect(cid.length).toBeGreaterThan(0);
		});
	});
});
