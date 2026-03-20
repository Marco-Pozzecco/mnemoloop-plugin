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
export interface DashboardProps {
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
