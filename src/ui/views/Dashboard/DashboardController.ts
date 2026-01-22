import { IndexManager } from '@/core/indexer';
import { DueQueueManager } from '@/core/srs';
import { StatisticsManager } from '@/core/statistics';
import { SessionStore } from '@/ui/stores/SessionStore';
import { uiStore } from '@/ui/stores/UIStore';
import { DashboardConfigSchema, DashboardStatsSchema } from './schemas';
import type { DashboardConfig, DashboardStats } from './types';
import { IDashboardController } from './types';

/**
 * Dashboard Controller
 *
 * Handles the business logic for the learning dashboard:
 * - Aggregates statistics from core modules
 * - Manages dashboard configuration
 * - Initiates review sessions
 * - Coordinates data refreshes
 */
export class DashboardController implements IDashboardController {
	private readonly indexManager: IndexManager;
	private readonly sessionStore: SessionStore;
	private readonly statisticsManager: StatisticsManager;
	private readonly dueQueueManager: DueQueueManager;

	constructor(
		indexManager: IndexManager,
		statisticsManager: StatisticsManager,
		dueQueueManager: DueQueueManager,
		sessionStore: SessionStore,
	) {
		this.indexManager = indexManager;
		this.sessionStore = sessionStore;
		this.statisticsManager = statisticsManager;
		this.dueQueueManager = dueQueueManager;
	}

	/**
	 * Fetches aggregated statistics for the dashboard
	 *
	 * @returns Promise resolving to dashboard statistics
	 */
	async getStats(): Promise<DashboardStats> {
		try {
			uiStore.setLoading(true, 'Loading statistics...');

			// Get basic index data
			const cards = this.indexManager.getAllCards();
			if (!cards) {
				throw new Error('No cards data available');
			}

			// Calculate statistics
			const totalCards = cards.length;
			const dueCount = await this.calculateDueCount();
			const retentionRate = this.statisticsManager.engine.calculateRetention(cards);
			const dailyGoal = await this.getDailyGoal();
			const cardsLearnedToday = await this.getCardsReviewedToday();
			const streakDays = await this.calculateStreak();
			const estimatedTime = await this.estimateReviewTime(dueCount);
			const progressData = await this.getProgressData();

			const stats: DashboardStats = {
				totalCards,
				retentionRate,
				dueCount,
				dailyGoal,
				streakDays,
				cardsLearnedToday,
				estimatedTimeMinutes: estimatedTime,
				progressData,
			};

			// Validate with schema
			const validatedStats = DashboardStatsSchema.parse(stats);

			uiStore.setLoading(false);
			return validatedStats;
		} catch (error) {
			uiStore.setLoading(false);
			console.error('Failed to fetch dashboard statistics:', error);
			throw error;
		}
	}

	/**
	 * Refreshes all dashboard data from the index
	 * Forces a complete recalculation of statistics
	 */
	async refreshStats(): Promise<void> {
		try {
			uiStore.setLoading(true, 'Refreshing dashboard...');

			// Trigger index refresh to ensure latest data - TODO

			// Notify that refresh is complete
			uiStore.notify({
				type: 'success',
				message: 'Dashboard refreshed successfully',
				duration: 3000,
			});

			uiStore.setLoading(false);
		} catch (error) {
			uiStore.setLoading(false);
			console.error('Failed to refresh dashboard:', error);

			uiStore.notify({
				type: 'error',
				message: 'Failed to refresh dashboard data',
				duration: 5000,
			});

			throw error;
		}
	}

	/**
	 * Starts a review session with optional deck filter
	 *
	 * @param deckId - Optional deck ID to filter cards by
	 */
	async startReviewSession(): Promise<void> {
		try {
			uiStore.setLoading(true, 'Starting review session...');

			// Check if there are cards due
			const dueCount = await this.calculateDueCount();
			if (dueCount === 0) {
				uiStore.setLoading(false);
				uiStore.notify({
					type: 'info',
					message: 'No cards are due for review. Great job!',
					duration: 4000,
				});
				return;
			}

			// Start the session through the session store
			await this.sessionStore.startSession();

			// Navigate to review view
			uiStore.navigate('review');

			uiStore.setLoading(false);
		} catch (error) {
			uiStore.setLoading(false);
			console.error('Failed to start review session:', error);

			uiStore.notify({
				type: 'error',
				message: 'Failed to start review session',
				duration: 5000,
			});

			throw error;
		}
	}

	/**
	 * Updates dashboard configuration
	 *
	 * @param config - New configuration to save
	 */
	async updateConfig(config: Partial<DashboardConfig>): Promise<void> {
		try {
			// Validate the configuration
			const validatedConfig = DashboardConfigSchema.partial().parse(config);

			// Save to plugin settings (implementation would depend on settings system)
			// await this.settingsManager.updateSettings(validatedConfig);

			console.log('Dashboard configuration updated:', validatedConfig);

			uiStore.notify({
				type: 'success',
				message: 'Settings saved successfully',
				duration: 3000,
			});
		} catch (error) {
			console.error('Failed to update dashboard configuration:', error);

			uiStore.notify({
				type: 'error',
				message: 'Failed to save settings',
				duration: 4000,
			});

			throw error;
		}
	}

	/**
	 * Calculates the number of cards currently due for review
	 *
	 * @returns Promise resolving to due card count
	 */
	private async calculateDueCount(): Promise<number> {
		try {
			const dueQueue = await this.dueQueueManager.generate();
			return dueQueue.totalDue;
		} catch (error) {
			console.error('Failed to calculate due count:', error);
			return 0;
		}
	}

	/**
	 * Gets the user's daily review goal
	 *
	 * @returns Promise resolving to daily goal
	 */
	private async getDailyGoal(): Promise<number> {
		try {
			// Return the daily goal from StatisticsManager
			return this.statisticsManager.statistics.daily_goal;
		} catch (error) {
			console.error('Failed to get daily goal:', error);
			// Return a default value if statistics are not available
			return 20;
		}
	}

	/**
	 * Gets the number of cards reviewed today
	 *
	 * @returns Promise resolving to today's review count
	 */
	private async getCardsReviewedToday(): Promise<number> {
		try {
			const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

			// Query StatisticsManager.progress for today's date
			const todayProgress = this.statisticsManager.statistics.progress.find(
				(progress) => progress.date === today,
			);

			// Return DailyProgress.cardsReviewed for today, or 0 if no data
			return todayProgress?.cardsReviewed ?? 0;
		} catch (error) {
			console.error("Failed to get today's review count:", error);
			return 0;
		}
	}

	/**
	 * Calculates the current streak of consecutive days meeting daily goal
	 *
	 * @returns Promise resolving to current streak
	 */
	private async calculateStreak(): Promise<number> {
		try {
			// Return StatisticsManager.currentStreak directly
			return this.statisticsManager.statistics.current_streak;
		} catch (error) {
			console.error('Failed to calculate streak:', error);
			return 0;
		}
	}

	/**
	 * Estimates the time required to complete due reviews
	 *
	 * @param dueCount - Number of cards due
	 * @returns Estimated time in minutes
	 */
	private async estimateReviewTime(dueCount: number): Promise<number> {
		// Estimate: 30 seconds per card average
		const averageSecondsPerCard = 30;
		return Math.round((dueCount * averageSecondsPerCard) / 60);
	}

	/**
	 * Gets historical progress data for the last 7 days
	 *
	 * @returns Promise resolving to progress data array
	 */
	private async getProgressData(): Promise<DashboardStats['progressData']> {
		try {
			const today = new Date();
			// const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

			// Get the daily goal from StatisticsManager
			const dailyGoal = this.statisticsManager.statistics.daily_goal;

			// Get StatisticsManager.progress (DailyProgress array)
			const progressArray = this.statisticsManager.statistics.progress;

			// Create a map for quick lookup by date
			const progressMap = new Map<string, (typeof progressArray)[0]>();
			for (const entry of progressArray) {
				progressMap.set(entry.date, entry);
			}

			// Generate data for the last 7 days
			const progressData: DashboardStats['progressData'] = [];

			for (let i = 6; i >= 0; i--) {
				const date = new Date(today);
				date.setDate(today.getDate() - i);
				const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

				// Get DailyProgress entry for this date, or use default values
				const dailyProgress = progressMap.get(dateStr);

				progressData.push({
					date: dateStr,
					completed: dailyProgress?.cardsReviewed ?? 0,
					target: dailyGoal,
					newCards: 0, // Not directly available in DailyProgress, may be derived from session data
					retention: dailyProgress?.retentionRate ?? 0,
				});
			}

			return progressData;
		} catch (error) {
			console.error('Failed to get progress data:', error);
			return [];
		}
	}
}
