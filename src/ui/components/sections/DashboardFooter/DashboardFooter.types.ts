import type { DashboardStats } from '../../views/Dashboard/Dashboard.types';

export interface DashboardFooterProps {
  stats: DashboardStats;
  onStartReview: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}
