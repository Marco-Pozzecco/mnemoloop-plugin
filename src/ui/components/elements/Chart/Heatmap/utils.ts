import type { Stats } from '@/schemas';
import type { HeatMapCell, YearStats } from './types';

/**
 * Transforms Stats.progress into heatmap cell data
 * Fills in empty cells for days with no data
 * @param stats - Statistics data
 * @param year - Year to display (defaults to current year)
 * @returns Array of heatmap cells
 */
export function transformStatsToHeatmap(
	stats: Stats,
	year: number = new Date().getFullYear(),
): HeatMapCell[] {
	const cells: HeatMapCell[] = [];

	// Get the start of the year (first day)
	const { start, end } = getYearBounds(year);

	// Find first Monday before or on Jan 1st for consistent week alignment
	const firstMonday = new Date(start);
	const dayOfWeek = firstMonday.getDay();
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	firstMonday.setDate(firstMonday.getDate() - daysToSubtract);

	// Generate all days for the year display
	let currentDate = new Date(firstMonday);

	while (currentDate <= end) {
		const dateString = formatDateString(currentDate);
		const dayData = stats.progress[dateString] ?? null;
		const value = dayData?.total_count ?? 0;

		cells.push({
			date: new Date(currentDate),
			dateString,
			value,
			data: dayData,
		});

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return cells;
}

/**
 * Gets start and end dates for a year
 */
export function getYearBounds(year: number): { start: Date; end: Date } {
	return {
		start: new Date(year, 0, 1),
		end: new Date(year, 11, 31, 23, 59),
	};
}

/**
 * Returns color range array for threshold scale
 * Uses Obsidian CSS variables for theming
 */
export function getColorRange(): string[] {
	return [
		'var(--background-modifier-border)',
		'color-mix(in srgb, var(--interactive-accent) 25%, transparent)',
		'color-mix(in srgb, var(--interactive-accent) 55%, transparent)',
		'var(--interactive-accent)',
	];
}

/**
 * Calculates year statistics from heatmap cells
 * @param cells - Array of heatmap cells
 * @param year - Target year
 * @returns Year statistics summary
 */
export function getYearStats(cells: HeatMapCell[], year: number): YearStats {
	let totalCards = 0;
	let activeDays = 0;
	let currentStreak = 0;
	let longestStreak = 0;
	let tempStreak = 0;

	// Filter cells for the target year only
	const yearCells = cells.filter((cell) => cell.date.getFullYear() === year);

	// Calculate totals
	for (const cell of yearCells) {
		if (cell.value > 0) {
			totalCards += cell.value;
			activeDays++;
			tempStreak++;
			longestStreak = Math.max(longestStreak, tempStreak);
		} else {
			tempStreak = 0;
		}
	}

	// Calculate current streak (from most recent day backward)
	const sortedCells = [...yearCells].sort((a, b) => b.date.getTime() - a.date.getTime());

	const today = new Date();
	const todayCell = sortedCells.find((c) => new Date(c.dateString) === today);

	if (todayCell && todayCell.value > 0) {
		currentStreak = 1;
		for (let i = 1; i < sortedCells.length; i++) {
			if (sortedCells[i].value > 0) {
				currentStreak++;
			} else {
				break;
			}
		}
	}

	return {
		totalCards,
		activeDays,
		longestStreak,
		currentStreak,
	};
}

/**
 * Formats retention rate as percentage
 * @param rate - Retention rate (0-1)
 * @returns Formatted percentage string
 */
export function formatRetentionRate(rate: number): string {
	return `${Math.round(rate * 100)}%`;
}

export function formatDateString(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
