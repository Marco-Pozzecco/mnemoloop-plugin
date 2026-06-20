import type { Stats } from '@/schemas';

export type ChartType = 'heatmap' | 'workload';

export default interface DashboardChartProps {
	stats: Stats;
	className?: string;
}
