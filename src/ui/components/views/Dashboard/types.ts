import type { BaseComponentProps, ActionComponentProps } from '@/ui/types';

/**
 * Interface for the Dashboard View controller.
 */
export interface IDashboardController {
	getStats(): Promise<any>;
	refreshStats(): Promise<void>;
	startReviewSession(deckId?: string): Promise<void>;
	updateConfig(config: any): Promise<void>;
}

/**
 * Timeframe options for dashboard charts and statistics.
 */
export type ChartTimeframe = 'week' | 'month' | 'year';

/**
 * Historical progress entry for a specific date, used for rendering charts.
 */
export interface ProgressEntry {
	/** Date in YYYY-MM-DD format */
	date: string;
	/** Number of cards completed on this date */
	completed: number;
	/** Daily goal target for this date */
	target: number;
	/** Number of new cards learned on this date */
	newCards: number;
	/** Average retention rate for reviews on this date (0-1) */
	retention: number;
}

/**
 * Aggregated statistics displayed on the dashboard.
 */
export interface DashboardStats {
	/** Total number of cards in the vault */
	totalCards: number;
	/** Overall retention rate across all cards (0-1) */
	retentionRate: number;
	/** Number of cards currently due for review */
	dueCount: number;
	/** Current daily goal for reviews */
	dailyGoal: number;
	/** Current consecutive days of meeting the daily goal */
	streakDays: number;
	/** Number of cards reviewed so far today */
	cardsLearnedToday: number;
	/** Estimated time in minutes to complete due reviews */
	estimatedTimeMinutes: number;
	/** Historical progress data for charts */
	progressData: ProgressEntry[];
}

/**
 * User preferences for dashboard display and behavior.
 */
export interface DashboardConfig {
	/** Daily review goal target */
	dailyGoal: number;
	/** Whether to show the progress chart */
	showProgressChart: boolean;
	/** Whether to show the retention rate metric */
	showRetentionRate: boolean;
	/** Selected timeframe for the progress chart */
	chartTimeframe: ChartTimeframe;
	/** Preferred visualization type for the progress chart */
	preferredChartType: 'bar' | 'line';
}

/**
 * Props for the main Dashboard view component.
 */
export interface DashboardProps extends BaseComponentProps {
	/** Current dashboard statistics */
	stats: DashboardStats;
	/** Dashboard configuration preferences */
	config: DashboardConfig;
	/** Callback for when a review session is requested */
	onStartReview?: () => void;
	/** Callback for when settings are changed */
	onConfigChange?: (config: Partial<DashboardConfig>) => void;
	/** Callback for when a manual refresh is requested */
	onRefresh?: () => void;
	/** Callback for when settings view is requested */
	onOpenSettings?: () => void;
}

/**
 * Props for individual statistics cards.
 */
export interface StatsCardProps extends BaseComponentProps {
	/** Label for the statistic */
	label: string;
	/** Current value to display */
	value: string | number;
	/** Optional icon identifier */
	icon?: string;
	/** Optional trend information */
	trend?: {
		/** Percentage change or absolute difference */
		value: number;
		/** Whether the trend is considered positive (e.g., higher retention is good) */
		isPositive: boolean;
	};
	/** Optional tooltip or subtext description */
	description?: string;
}

/**
 * Props for the progress chart component.
 */
export interface ProgressChartProps extends BaseComponentProps {
	/** Historical data to visualize */
	data: ProgressEntry[];
	/** Current timeframe being displayed */
	timeframe: ChartTimeframe;
	/** Chart height in pixels */
	height?: number;
	/** Whether to show the target goal line */
	showGoalLine?: boolean;
}

/**
 * Props for dashboard action buttons.
 */
export interface DashboardActionProps extends ActionComponentProps {
	/** Button label text */
	label: string;
	/** Optional icon identifier */
	icon?: string;
	/** Visual style variant */
	variant?: 'primary' | 'secondary' | 'ghost';
}
