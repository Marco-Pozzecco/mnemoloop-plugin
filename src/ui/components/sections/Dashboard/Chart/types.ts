import type { ReviewHistory, Stats } from '@/schemas';

export default interface DashboardChartProps {
  stats: Stats;
  history: ReviewHistory;
  className?: string;
}
