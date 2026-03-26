import type { Stats } from '@/schemas';
import type { DashboardConfig } from '@/ui/components/views/Dashboard/types';

export default interface DashboardStatsGridProps {
  stats: Stats;
  config: DashboardConfig;
  className?: string;
}
