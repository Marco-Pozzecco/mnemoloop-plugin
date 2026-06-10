import { describe, it, expect } from 'vitest';
import { getIntervalPreview } from '@/ui/components/sections/Settings/FsrsParams/utils';
import { FSRS, generatorParameters, createEmptyCard, Rating } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';

describe('getIntervalPreview', () => {
	it('should return 5 intervals for Rating.Good', () => {
		const fsrs = new FSRS(generatorParameters({}));
		const card = createEmptyCard(new Date());
		const now = new Date();

		const intervals = getIntervalPreview(fsrs, card as Card, now, Rating.Good as Grade, 5);

		expect(intervals).toHaveLength(5);
		expect(intervals.every((s: string) => typeof s === 'string' && s.length > 0)).toBe(true);
	});

	it('should return valid interval strings (day, hour, or minute)', () => {
		const fsrs = new FSRS(generatorParameters({}));
		const card = createEmptyCard(new Date());
		const now = new Date();

		const intervals = getIntervalPreview(fsrs, card as Card, now, Rating.Good as Grade, 5);

		intervals.forEach((interval: string) => {
			expect(interval).toMatch(/\d+ (day|days|hour|hours|minute|minutes)/);
		});
	});

	it('should return different intervals for different ratings', () => {
		const fsrs = new FSRS(generatorParameters({}));
		const card = createEmptyCard(new Date());
		const now = new Date();

		const again = getIntervalPreview(fsrs, card as Card, now, Rating.Again as Grade, 5);
		const easy = getIntervalPreview(fsrs, card as Card, now, Rating.Easy as Grade, 5);

		expect(again).not.toEqual(easy);
	});

	it('should produce longer intervals for Easy than Again', () => {
		const fsrs = new FSRS(generatorParameters({}));
		const card = createEmptyCard(new Date());
		const now = new Date();

		const again = getIntervalPreview(fsrs, card as Card, now, Rating.Again as Grade, 5);
		const easy = getIntervalPreview(fsrs, card as Card, now, Rating.Easy as Grade, 5);

		const toMinutes = (s: string): number => {
			const [num, unit] = s.split(' ');
			const n = parseInt(num, 10);
			if (unit.startsWith('day')) return n * 24 * 60;
			if (unit.startsWith('hour')) return n * 60;
			return n;
		};

		const againTotal = again.reduce((sum: number, s: string) => sum + toMinutes(s), 0);
		const easyTotal = easy.reduce((sum: number, s: string) => sum + toMinutes(s), 0);

		expect(easyTotal).toBeGreaterThan(againTotal);
	});
});
