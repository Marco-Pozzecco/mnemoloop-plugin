import { describe, it, expect } from 'vitest';
import { computeRetentionRateOverTime } from '@/ui/components/elements/Chart/Flashcards/RetentionRate/utils';

function makeProgress(date: string, retention: number) {
	return {
		retention_rate: retention,
		total_count: 10,
		correct_count: Math.round(retention * 10),
		incorrect_count: Math.round((1 - retention) * 10),
		sessions_completed: 1,
		total_duration: 120,
		goal_completed: false,
	};
}

describe('computeRetentionRateOverTime', () => {
	it('returns empty array for empty progress', () => {
		expect(computeRetentionRateOverTime({})).toEqual([]);
	});

	it('extracts chronological spot values and their linear regression trend', () => {
		const progress = {
			'2024-06-20': makeProgress('2024-06-20', 0.6),
			'2024-06-19': makeProgress('2024-06-19', 0.9),
			'2024-06-21': makeProgress('2024-06-21', 0.7),
		};
		const result = computeRetentionRateOverTime(progress);
		expect(result).toHaveLength(3);
		expect(result[0].date.toISOString().split('T')[0]).toBe('2024-06-19');
		expect(result[0].retention).toBe(0.9);
		expect(result[0].trendRetention).toBeCloseTo(0.833333);
		expect(result[1].date.toISOString().split('T')[0]).toBe('2024-06-20');
		expect(result[1].retention).toBe(0.6);
		expect(result[1].trendRetention).toBeCloseTo(0.733333);
		expect(result[2].date.toISOString().split('T')[0]).toBe('2024-06-21');
		expect(result[2].retention).toBe(0.7);
		expect(result[2].trendRetention).toBeCloseTo(0.633333);
	});

	it('handles 0% retention days', () => {
		const progress = {
			'2024-06-20': makeProgress('2024-06-20', 0),
		};
		const result = computeRetentionRateOverTime(progress);
		expect(result).toHaveLength(1);
		expect(result[0].retention).toBe(0);
	});

	it('handles 100% retention days', () => {
		const progress = {
			'2024-06-20': makeProgress('2024-06-20', 1),
		};
		const result = computeRetentionRateOverTime(progress);
		expect(result).toHaveLength(1);
		expect(result[0].retention).toBe(1);
	});
});
