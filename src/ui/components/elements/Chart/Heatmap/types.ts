import type { DailyProgress, Stats } from '@/schemas';

export default interface HeatMapProps {
	stats: Stats;
	year?: number;
	className?: string;
}

export interface HeatMapCell {
	date: Date;
	dateString: string;
	value: number;
	data: DailyProgress | null;
}

export interface YearStats {
	totalCards: number;
	activeDays: number;
	longestStreak: number;
	currentStreak: number;
}
