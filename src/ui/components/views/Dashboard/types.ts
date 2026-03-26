import { Stats } from "@/schemas";
import { ReviewHistory } from "@/schemas/history";

export type ChartTimeframe = 'week' | 'month' | 'year';

export interface ProgressEntry {
  date: string;
  completed: number;
  target: number;
  newCards: number;
  retention: number;
}

export interface DashboardConfig {
  dailyGoal: number;
  showProgressChart: boolean;
  showRetentionRate: boolean;
  chartTimeframe: ChartTimeframe;
  preferredChartType: 'bar' | 'line';
}

export default interface DashboardProps {
  stats: Stats;
  history: ReviewHistory;
  config: DashboardConfig;
  onStartReview?: () => void;
  onConfigChange?: (config: Partial<DashboardConfig>) => void;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
}
