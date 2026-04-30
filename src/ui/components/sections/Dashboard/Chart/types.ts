import type { Stats } from '@/schemas';
import { ChartType } from '@/ui/components/views/Dashboard/types';

export default interface DashboardChartProps {
	stats: Stats;
	chartType: ChartType;
	className?: string;
}
