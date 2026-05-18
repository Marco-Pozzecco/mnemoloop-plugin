import { vi } from 'vitest';

export const FIXED_DATE = new Date('2026-05-18T10:00:00.000Z');
export const FIXED_TIMESTAMP = FIXED_DATE.getTime();

export const TODAY = new Date(FIXED_DATE);
export const YESTERDAY = new Date(FIXED_DATE);
YESTERDAY.setDate(YESTERDAY.getDate() - 1);

export const TOMORROW = new Date(FIXED_DATE);
TOMORROW.setDate(TOMORROW.getDate() + 1);

export const NEXT_WEEK = new Date(FIXED_DATE);
NEXT_WEEK.setDate(NEXT_WEEK.getDate() + 7);

/**
 * Set vitest fake timers to the fixed date.
 * Use in beforeEach() for date-dependent tests.
 */
export function useFixedDate(): void {
	vi.useFakeTimers({ shouldAdvanceTime: false });
	vi.setSystemTime(FIXED_DATE);
}

/**
 * Advance fake timers by N days.
 */
export function advanceDays(n: number): void {
	const now = Date.now();
	vi.setSystemTime(now + n * 24 * 60 * 60 * 1000);
}

/**
 * Restore real timers after test.
 * Use in afterEach() paired with useFixedDate().
 */
export function restoreRealTimers(): void {
	vi.useRealTimers();
}
