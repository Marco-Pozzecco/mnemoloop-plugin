export type ChartTimeframe = 'week' | 'month' | 'year';

export interface DashboardConfig {
	showProgressChart: boolean;
	showRetentionRate: boolean;
	chartTimeframe: ChartTimeframe;
	chartType: ChartType;
}

export type ChartType = 'heatmap';
