import type { ReviewSession, Stats } from '@/schemas';

export default interface ChartSessionsProps {
	stats: Stats | null;
	className?: string;
}

export interface SessionDay {
	date: Date;
	dateString: string;
	value: number;
	sessions: ReviewSession[];
}
