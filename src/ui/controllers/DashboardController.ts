/**
 * Dashboard Controller
 *
 * Manages dashboard statistics and data updates.
 * Listens to session completion events to refresh statistics automatically.
 *
 * @see FR-003: System MUST provide base controller class
 * @see US-004: Dependency Injection for Testability
 */

import { AppEvents, type EventBus } from '../infrastructure/EventBus';
import type { Logger } from '@/utils/Logger';
import { BaseController } from './BaseController';
import type { IndexManager } from '@/core/indexer';
import type { StatisticsManager } from '@/core/statistics';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
	totalCards: number;
	dueCards: number;
	reviewedToday: number;
	averageRetention: number;
}

/**
 * Controller for dashboard functionality
 *
 * Manages:
 * - Loading and retrieving dashboard statistics
 * - Automatic refresh on session completion
 * - Lifecycle management
 */
export class DashboardController extends BaseController {
	private indexManager: IndexManager;
	private statisticsManager: StatisticsManager;
	private unsubscribeSessionCompleted?: () => void;
	private statsCache: DashboardStats | null = null;

	constructor(
		logger: Logger,
		eventBus: EventBus,
		indexManager: IndexManager,
		statisticsManager: StatisticsManager,
	) {
		super(logger, eventBus);
		this.indexManager = indexManager;
		this.statisticsManager = statisticsManager;
	}

	/**
	 * Initialize the dashboard controller
	 *
	 * Sets up event subscriptions to refresh statistics when sessions complete.
	 */
	async initialize(): Promise<void> {
		this.logger.info('DashboardController initializing');

		// Subscribe to session completion events
		this.unsubscribeSessionCompleted = this.eventBus.on(
			AppEvents.SESSION_COMPLETED,
			this.handleSessionCompleted.bind(this),
		);

		this.logger.info('DashboardController initialized');
	}

	/**
	 * Get dashboard statistics
	 *
	 * Loads and returns the current dashboard statistics.
	 * Uses error handling wrapper to gracefully handle failures.
	 *
	 * @returns Dashboard statistics or null if loading fails
	 */
	async getStats(): Promise<DashboardStats | null> {
		return this.executeWithErrorHandling('Loading dashboard statistics', async () => {
			// If cache is available and recent, return it
			if (this.statsCache) {
				return this.statsCache;
			}

			// Load statistics from statistics manager
			const stats = await this.refreshDashboard();
			return stats;
		});
	}

	/**
	 * Refresh dashboard statistics
	 *
	 * Forces a refresh of dashboard statistics from the managers.
	 *
	 * @returns Fresh dashboard statistics or null if refresh fails
	 */
	async refreshDashboard(): Promise<DashboardStats | null> {
		return this.executeWithErrorHandling('Refreshing dashboard statistics', async () => {
			// Get statistics from StatisticsManager
			const statistics = this.statisticsManager.statistics;

			// Get index from IndexManager
			const index = this.indexManager.index;
			const allCards = Object.values(index.cards);

			// Calculate due cards (cards with due date in the past)
			const now = new Date();
			const dueCards = allCards.filter((card) => {
				const dueDate = new Date(card.srs.next_review);
				return dueDate <= now;
			}).length;

			// Calculate reviewed today from statistics history
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const reviewedToday = statistics.history
				.filter((session) => {
					const sessionDate = new Date(session.date);
					return sessionDate >= today;
				})
				.reduce((total, session) => total + session.cardsReviewed, 0);

			// Calculate average retention
			const totalReviewed = statistics.history.reduce(
				(total, session) => total + session.cardsReviewed,
				0,
			);
			const totalCorrect = statistics.history.reduce(
				(total, session) => total + session.correctCount,
				0,
			);
			const averageRetention = totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;

			// Build stats object
			const dashboardStats: DashboardStats = {
				totalCards: allCards.length,
				dueCards,
				reviewedToday,
				averageRetention: Math.round(averageRetention),
			};

			// Cache the stats
			this.statsCache = dashboardStats;

			// Log correlation ID for tracing
			this.logCorrelationId();

			return dashboardStats;
		});
	}

	/**
	 * Handle session completed event
	 *
	 * Called automatically when a review session completes.
	 * Refreshes dashboard statistics to show updated data.
	 */
	private handleSessionCompleted(): void {
		this.logger.info('Session completed, refreshing dashboard statistics');
		this.refreshDashboard().catch((error) => {
			this.logger.error('Failed to refresh dashboard after session completed:', error);
		});
	}

	/**
	 * Clear the statistics cache
	 *
	 * Forces the next getStats() call to reload data.
	 */
	clearStatsCache(): void {
		this.statsCache = null;
		this.logger.debug('Dashboard statistics cache cleared');
	}

	/**
	 * Dispose of the dashboard controller
	 *
	 * Cleans up event subscriptions and resources.
	 */
	async dispose(): Promise<void> {
		this.logger.info('DashboardController disposing');

		// Unsubscribe from events
		if (this.unsubscribeSessionCompleted) {
			this.unsubscribeSessionCompleted();
			this.unsubscribeSessionCompleted = undefined;
		}

		// Clear cache
		this.statsCache = null;

		this.logger.info('DashboardController disposed');
	}
}
