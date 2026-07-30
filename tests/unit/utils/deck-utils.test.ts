import { describe, expect, it } from 'vitest';
import {
	DECK_SEPARATOR,
	formatDeckList,
	getParentDecks,
	matchesDeckFilter,
	parseDeckList,
	splitDeckPath,
} from '@/utils/deck-utils';

describe('deck-utils', () => {
	describe('DECK_SEPARATOR', () => {
		it('should be ::', () => {
			expect(DECK_SEPARATOR).toBe('::');
		});
	});

	describe('splitDeckPath', () => {
		it('should split a simple deck path', () => {
			expect(splitDeckPath('Maths')).toEqual(['Maths']);
		});

		it('should split a nested deck path', () => {
			expect(splitDeckPath('Maths::Linear algebra')).toEqual(['Maths', 'Linear algebra']);
		});

		it('should split a deeply nested deck path', () => {
			expect(splitDeckPath('Maths::LA::Matrices')).toEqual(['Maths', 'LA', 'Matrices']);
		});
	});

	describe('getParentDecks', () => {
		it('should return empty array for a top-level deck', () => {
			expect(getParentDecks('Maths')).toEqual([]);
		});

		it('should return parent for a two-level deck', () => {
			expect(getParentDecks('Maths::LA')).toEqual(['Maths']);
		});

		it('should return all parents for a deeply nested deck', () => {
			expect(getParentDecks('Maths::LA::Matrices')).toEqual(['Maths', 'Maths::LA']);
		});
	});

	describe('matchesDeckFilter', () => {
		it('should return true when card deck exactly matches filter', () => {
			expect(matchesDeckFilter(['Maths'], 'Maths')).toBe(true);
		});

		it('should return true when card deck is a child of filter', () => {
			expect(matchesDeckFilter(['Maths::LA'], 'Maths')).toBe(true);
		});

		it('should return true for deeply nested child', () => {
			expect(matchesDeckFilter(['Maths::LA::Matrices'], 'Maths')).toBe(true);
		});

		it('should return true when any deck matches', () => {
			expect(matchesDeckFilter(['Maths::LA', 'CS'], 'Maths')).toBe(true);
		});

		it('should return false when no deck matches', () => {
			expect(matchesDeckFilter(['CS'], 'Maths')).toBe(false);
		});

		it('should return false for partial string match (not prefix)', () => {
			expect(matchesDeckFilter(['MathsHistory'], 'Maths')).toBe(false);
		});

		it('should return true for exact child match', () => {
			expect(matchesDeckFilter(['Maths::LA'], 'Maths::LA')).toBe(true);
		});

		it('should return true for grandchild of filter', () => {
			expect(matchesDeckFilter(['Maths::LA::Matrices'], 'Maths::LA')).toBe(true);
		});

		it('should return false for empty card decks array', () => {
			expect(matchesDeckFilter([], 'Maths')).toBe(false);
		});

		it('should return false for empty-string filter', () => {
			expect(matchesDeckFilter(['Maths'], '')).toBe(false);
		});
	});

	describe('parseDeckList', () => {
		it('should split a simple comma-separated list', () => {
			expect(parseDeckList('A, B, C')).toEqual(['A', 'B', 'C']);
		});

		it('should trim whitespace around each entry', () => {
			expect(parseDeckList('  A  ,  B  ')).toEqual(['A', 'B']);
		});

		it('should filter out empty entries', () => {
			expect(parseDeckList('A,,B,,')).toEqual(['A', 'B']);
		});

		it('should return an empty array for an empty string', () => {
			expect(parseDeckList('')).toEqual([]);
		});

		it('should return an empty array for whitespace-only input', () => {
			expect(parseDeckList('  ')).toEqual([]);
		});

		it('should preserve :: nesting separators', () => {
			expect(parseDeckList('Math::Algebra, Hard')).toEqual(['Math::Algebra', 'Hard']);
		});
	});

	describe('formatDeckList', () => {
		it('should join a list with comma and space', () => {
			expect(formatDeckList(['A', 'B', 'C'])).toBe('A, B, C');
		});

		it('should return an empty string for an empty list', () => {
			expect(formatDeckList([])).toBe('');
		});

		it('should return the single element without trailing separator', () => {
			expect(formatDeckList(['A'])).toBe('A');
		});

		it('should preserve :: nesting in formatted output', () => {
			expect(formatDeckList(['Math::Algebra', 'Hard'])).toBe('Math::Algebra, Hard');
		});
	});

	describe('edge cases', () => {
		it('should handle trailing separator in deck path', () => {
			expect(splitDeckPath('Maths::')).toEqual(['Maths', '']);
			expect(getParentDecks('Maths::')).toEqual(['Maths']);
		});

		it('should handle leading separator in deck path', () => {
			expect(splitDeckPath('::Maths')).toEqual(['', 'Maths']);
			expect(getParentDecks('::Maths')).toEqual(['']);
		});

		it('should handle empty deck path', () => {
			expect(splitDeckPath('')).toEqual(['']);
			expect(getParentDecks('')).toEqual([]);
		});

		it('should handle deck with only separators', () => {
			expect(splitDeckPath('::')).toEqual(['', '']);
			expect(getParentDecks('::')).toEqual(['']);
		});

		it('should reject partial string with separator edge case', () => {
			expect(matchesDeckFilter(['Maths::History'], 'Maths')).toBe(true);
			expect(matchesDeckFilter(['MathsHistory'], 'Maths')).toBe(false);
		});

		it('should round-trip through parseDeckList and formatDeckList idempotently', () => {
			expect(formatDeckList(parseDeckList('A, B, C'))).toBe('A, B, C');
			expect(formatDeckList(parseDeckList('  A  ,  B  '))).toBe('A, B');
			expect(formatDeckList(parseDeckList('A,,B,,'))).toBe('A, B');
			expect(formatDeckList(parseDeckList(''))).toBe('');
			expect(formatDeckList(parseDeckList('  '))).toBe('');
			expect(formatDeckList(parseDeckList('Math::Algebra, Hard'))).toBe('Math::Algebra, Hard');
		});
	});
});
