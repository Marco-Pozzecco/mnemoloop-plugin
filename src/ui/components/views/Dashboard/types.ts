import { DashboardController } from '@/ui/controllers/DashboardController';

export type ChartTimeframe = 'week' | 'month' | 'year';

export interface DashboardConfig {
	showProgressChart: boolean;
	showRetentionRate: boolean;
	chartTimeframe: ChartTimeframe;
	chartType: 'bar' | 'line';
}

export default interface DashboardProps {
	controller: DashboardController;
}
