import type { Stats } from "@/schemas";

export default interface DashboardFooterProps {
  stats: Stats;
  onStartReview: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}
