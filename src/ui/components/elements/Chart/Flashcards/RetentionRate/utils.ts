import type { DailyProgress } from '@/schemas';

export interface RetentionRatePoint {
	date: Date;
	retention: number;
	trendRetention: number;
}

/**
 * Extract per-day spot retention from stats.progress and calculate a linear
 * regression trend in chronological order. Returns an empty array for no history.
 */
export function computeRetentionRateOverTime(
	progress: Record<string, DailyProgress>,
): RetentionRatePoint[] {
	const points = Object.entries(progress)
		.map(([dateStr, day]) => ({
			date: new Date(dateStr),
			retention: day.retention_rate,
		}))
		.sort((a, b) => a.date.getTime() - b.date.getTime());

	if (points.length === 0) return [];

	let totalTime = 0;
	let totalRetention = 0;

	for (const point of points) {
		totalTime += point.date.getTime();
		totalRetention += point.retention;
	}

	const averageTime = totalTime / points.length;
	const averageRetention = totalRetention / points.length;
	let timeVariance = 0;
	let retentionCovariance = 0;

	for (const point of points) {
		const timeDelta = point.date.getTime() - averageTime;

		timeVariance += timeDelta * timeDelta;
		retentionCovariance += timeDelta * (point.retention - averageRetention);
	}

	const slope = timeVariance === 0 ? 0 : retentionCovariance / timeVariance;

	return points.map((point) => ({
		...point,
		trendRetention: averageRetention + slope * (point.date.getTime() - averageTime),
	}));
}
