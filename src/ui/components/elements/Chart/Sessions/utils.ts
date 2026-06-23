import type { Stats, ReviewSession } from '@/schemas';
import type { SessionDay } from './types';

/**
 * Gets start and end dates for the last N months.
 * Start = 1st of (current month - (months-1)), end = last day of current month.
 */
export function getDateRange(months: number): { start: Date; end: Date } {
	const end = new Date();
	end.setMonth(end.getMonth() + 1, 0);
	end.setHours(23, 59, 59, 999);

	const start = new Date(end);
	start.setMonth(start.getMonth() - (months - 1));
	start.setDate(1);
	start.setHours(0, 0, 0, 0);

	return { start, end };
}

function formatDateString(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Transforms Stats.sessions into daily SessionDay[] data.
 * Filters sessions to the given date range, generates all days
 * from the first Monday on/before bounds.start through bounds.end,
 * and groups sessions per day.
 */
export function transformSessionsToData(
	stats: Stats,
	bounds: { start: Date; end: Date },
): SessionDay[] {
	// Build map of sessions keyed by date string
	const sessionMap: Record<string, ReviewSession[]> = {};

	for (const session of stats.sessions) {
		const sessionDate = new Date(session.date);

		// Only include sessions within bounds
		if (sessionDate < bounds.start || sessionDate > bounds.end) continue;

		const dateString = formatDateString(sessionDate);
		if (!sessionMap[dateString]) {
			sessionMap[dateString] = [];
		}
		sessionMap[dateString].push(session);
	}

	// Find first Monday on or before bounds.start for consistent week alignment
	const firstMonday = new Date(bounds.start);
	const dayOfWeek = firstMonday.getDay();
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	firstMonday.setDate(firstMonday.getDate() - daysToSubtract);
	firstMonday.setHours(0, 0, 0, 0);

	// Generate days
	const days: SessionDay[] = [];
	const currentDate = new Date(firstMonday);

	while (currentDate <= bounds.end) {
		const dateString = formatDateString(currentDate);
		const sessions = sessionMap[dateString] ?? [];

		days.push({
			date: new Date(currentDate),
			dateString,
			value: sessions.length,
			sessions,
		});

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return days;
}

/**
 * Calculates summary stats: total sessions count and number of active days.
 */
export function getSessionStats(days: SessionDay[]): {
	totalSessions: number;
	activeDays: number;
} {
	let totalSessions = 0;
	let activeDays = 0;

	for (const day of days) {
		totalSessions += day.value;
		if (day.value > 0) activeDays++;
	}

	return { totalSessions, activeDays };
}
