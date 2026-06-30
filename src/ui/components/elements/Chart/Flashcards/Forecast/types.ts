export default interface ForecastChartProps {
	className?: string;
}

export interface ForecastDatum {
	date: string;
	entity: 'flashcard' | 'overdue';
	value: number;
}
