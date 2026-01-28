import type { DashboardStats, DashboardConfig } from '../../views/Dashboard/Dashboard.types';

export interface DashboardStatsGridProps {
  stats: DashboardStats;
  config: DashboardConfig;
  className?: string;
}
