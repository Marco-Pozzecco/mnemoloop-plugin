import type { Stats } from '@/schemas';

export default interface RetentionRateChartProps {
	stats: Stats | null;
	requestRetention: number;
	className?: string;
}
