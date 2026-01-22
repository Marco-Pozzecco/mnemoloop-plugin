import type { SvelteComponent } from 'svelte';
import { PluginView } from '@/obsidian/PluginView';
import { uiStore } from '@/ui/stores/UIStore';
import { statisticsStore } from '@/ui/stores/StatisticsStore';
import type { DashboardProps, DashboardStats } from './types';
import Dashboard from './Dashboard.svelte';
import { DashboardController } from './DashboardController';

export const DASHBOARD_VIEW_TYPE = 'knowledge-accelerator-dashboard';

/**
 * Dashboard View implementation for Obsidian.
 *
 * This view provides the main learning dashboard with:
 * - Statistics display (total cards, retention rate, due cards)
 * - Daily goal tracking and progress
 * - 7-day historical progress chart
 * - Quick actions to start review sessions
 */
export class DashboardView extends PluginView {
	/** Unique view type identifier */
	protected viewType = DASHBOARD_VIEW_TYPE;
	/** Display text for the view tab */
	protected displayText = 'Knowledge Accelerator';
	/** Icon for the view tab */
	public icon = 'brain-circuit';

	/** Dashboard controller instance */
	private dashboardController?: DashboardController;
	/** Currently loaded statistics */
	private currentStats: DashboardStats | null = null;
	/** Loading state for data fetching */
	private isLoading = false;

	/**
	 * Creates and mounts Dashboard Svelte component
	 *
	 * @param container - The DOM element to mount component into
	 * @returns The mounted Svelte component
	 */
	protected async createSvelteComponent(container: Element): Promise<SvelteComponent> {
		// Initialize dashboard controller
		this.dashboardController = new DashboardController(
			this.indexManager,
			this.statisticsManager,
			this.dueQueueManager,
			this.sessionStore,
		);

		// Create component props
		const props: DashboardProps = {
			stats: await this.getInitialStats(), // Use real data from controller
			config: this.getConfig(),
			onStartReview: this.handleStartReview.bind(this),
			onConfigChange: this.handleConfigChange.bind(this),
			onRefresh: this.refreshData.bind(this),
			onOpenSettings: this.handleOpenSettings.bind(this),
		};

		// Create and mount the component
		return new Dashboard({
			target: container,
			props,
		});
	}

	/**
	 * Called when view is opened
	 */
	async onOpen(): Promise<void> {
		await super.onOpen();

		// Set current view in UI store
		uiStore.navigate('dashboard');

		// Initial stats are already loaded in createSvelteComponent
		// Just ensure data is fresh
		await this.refreshData();

		// Set up real-time statistics updates when sessions complete
		this.setupSessionCompleteListener();
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		await super.onClose();
		this.dashboardController = undefined;
		this.currentStats = null;
	}

	/**
	 * Gets initial dashboard statistics
	 *
	 * @returns Promise resolving to dashboard statistics
	 */
	private async getInitialStats(): Promise<DashboardStats> {
		if (!this.dashboardController) {
			const fallbackStats = this.getFallbackStats();
			statisticsStore.set(fallbackStats);
			return fallbackStats;
		}

		try {
			const stats = await this.dashboardController.getStats();
			statisticsStore.set(stats);
			return stats;
		} catch (error) {
			console.error('Failed to get initial dashboard stats:', error);
			const fallbackStats = this.getFallbackStats();
			statisticsStore.set(fallbackStats);
			return fallbackStats;
		}
	}

	/**
	 * Gets fallback statistics when controller fails
	 *
	 * @returns Fallback dashboard statistics
	 */
	private getFallbackStats(): DashboardStats {
		return {
			totalCards: 0,
			retentionRate: 0,
			dueCount: 0,
			dailyGoal: 20,
			streakDays: 0,
			cardsLearnedToday: 0,
			estimatedTimeMinutes: 0,
			progressData: this.getFallbackProgressData(),
		};
	}

	/**
	 * Gets fallback progress data when controller fails
	 *
	 * @returns Empty progress data for last 7 days
	 */
	private getFallbackProgressData(): DashboardStats['progressData'] {
		const progressData: DashboardStats['progressData'] = [];
		const today = new Date();

		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			progressData.push({
				date: date.toISOString().split('T')[0],
				completed: 0,
				target: 20,
				newCards: 0,
				retention: 0,
			});
		}

		return progressData;
	}

	/**
	 * Refreshes dashboard data from the core system
	 */
	async refreshData(): Promise<void> {
		if (!this.dashboardController) return;

		try {
			this.setLoading(true);

			// Fetch fresh statistics
			const stats = await this.dashboardController.getStats();
			this.currentStats = stats;

			// Update both component and reactive store
			if (this.component) {
				this.component.$set({ stats });
			}
			
			// Update reactive statistics store for real-time updates
			statisticsStore.set(stats);

			this.setLoading(false);
		} catch (error) {
			console.error('Failed to refresh dashboard data:', error);
			this.displayError('Failed to load dashboard data. Please try again.');
			this.setLoading(false);
		}
	}

	/**
	 * Handles starting a review session
	 */
	private async handleStartReview(): Promise<void> {
		if (!this.dashboardController) return;

		try {
			await this.dashboardController.startReviewSession();
			// Navigation to review view will be handled by the UI store
			uiStore.navigate('review');
		} catch (error) {
			console.error('Failed to start review session:', error);
			uiStore.notify({
				type: 'error',
				message: 'Failed to start review session. Please try again.',
				duration: 5000,
			});
		}
	}

	/**
	 * Handles opening the settings tab
	 */
	private handleOpenSettings(): void {
		try {
			// @ts-expect-error - Obsidian internal API
			this.app.setting.openTabById('obs-knowledge-accelerator');
		} catch (error) {
			console.error('Failed to open settings tab:', error);
			uiStore.notify({
				type: 'error',
				message: 'Could not open settings automatically.',
				duration: 3000,
			});
		}
	}

	/**
	 * Handles configuration changes from the dashboard
	 *
	 * @param configChanges - Partial configuration updates
	 */
	private async handleConfigChange(
		configChanges: Partial<DashboardProps['config']>,
	): Promise<void> {
		if (!this.dashboardController) return;

		try {
			// Update configuration
			const currentConfig = this.getConfig();
			const newConfig = { ...currentConfig, ...configChanges };

			// Save configuration (implementation would depend on settings system)
			// await this.dashboardController.updateConfig(newConfig);

			console.log('Dashboard configuration updated:', newConfig);
		} catch (error) {
			console.error('Failed to update dashboard configuration:', error);
			uiStore.notify({
				type: 'error',
				message: 'Failed to save settings.',
				duration: 3000,
			});
		}
	}

	/**
	 * Gets current dashboard configuration
	 *
	 * @returns Current configuration object
	 */
	private getConfig(): DashboardProps['config'] {
		// This would typically come from plugin settings
		// For now, return defaults
		return {
			dailyGoal: 20,
			showProgressChart: true,
			showRetentionRate: true,
			chartTimeframe: 'week',
			preferredChartType: 'bar',
		};
	}

	/**
	 * Gets mock statistics for testing (will be replaced with real data)
	 *
	 * @returns Mock dashboard statistics
	 */
	private getMockStats(): DashboardStats {
		return {
			totalCards: 245,
			retentionRate: 0.87,
			dueCount: 12,
			dailyGoal: 20,
			streakDays: 5,
			cardsLearnedToday: 8,
			estimatedTimeMinutes: 15,
			progressData: [
				{
					date: '2026-01-08',
					completed: 18,
					target: 20,
					newCards: 3,
					retention: 0.89,
				},
				{
					date: '2026-01-09',
					completed: 22,
					target: 20,
					newCards: 5,
					retention: 0.91,
				},
				{
					date: '2026-01-10',
					completed: 15,
					target: 20,
					newCards: 2,
					retention: 0.85,
				},
				{
					date: '2026-01-11',
					completed: 20,
					target: 20,
					newCards: 4,
					retention: 0.88,
				},
				{
					date: '2026-01-12',
					completed: 25,
					target: 20,
					newCards: 6,
					retention: 0.92,
				},
				{
					date: '2026-01-13',
					completed: 19,
					target: 20,
					newCards: 3,
					retention: 0.87,
				},
				{
					date: '2026-01-14',
					completed: 8,
					target: 20,
					newCards: 1,
					retention: 0.86,
				},
			],
		};
	}

	/**
	 * Sets up listener for session completion events to trigger real-time updates
	 */
	private setupSessionCompleteListener(): void {
		// Subscribe to session store to detect session completion
		this.sessionStore.subscribe((state) => {
			// Check if a session just completed (activeSession became null but stats were just saved)
			if (!state.activeSession && state.sessionStats.totalReviewed > 0) {
				// Session just completed, refresh dashboard data
				this.refreshData();
			}
		});
	}

	/**
	 * Sets loading state and updates component
	 *
	 * @param loading - Whether view is loading
	 */
	setLoading(loading: boolean): void {
		this.isLoading = loading;
		uiStore.setLoading(loading, loading ? 'Loading dashboard...' : undefined);

		if (this.component) {
			this.component.$set({ loading });
		}
	}
}

/**
 * Interface for dashboard controller implementation
 * This would be implemented by DashboardController class
 */
export interface IDashboardController {
	/**
	 * Fetches aggregated statistics for the dashboard
	 */
	getStats(): Promise<DashboardStats>;

	/**
	 * Refreshes all dashboard data from the index
	 */
	refreshStats(): Promise<void>;

	/**
	 * Starts a review session with optional deck filter
	 *
	 * @param deckId - Optional deck ID to filter cards
	 */
	startReviewSession(deckId?: string): Promise<void>;

	/**
	 * Updates dashboard configuration
	 *
	 * @param config - New configuration to save
	 */
	updateConfig(config: any): Promise<void>;
}
