import { describe, expect, it } from 'vitest';
import {
	coerceControlValue,
	formatSteps,
	formatTags,
	parseSteps,
	parseTags,
	readControlValue,
	stripLeadingSlash,
	toSourceNoteDirectory,
	toVaultPath,
} from '@/ui/views/Settings/utils';

describe('settings-controls', () => {
	describe('stripLeadingSlash', () => {
		it('removes leading slashes and leaves relative paths untouched', () => {
			expect(stripLeadingSlash('/notes/sub')).toBe('notes/sub');
			expect(stripLeadingSlash('notes')).toBe('notes');
			expect(stripLeadingSlash('')).toBe('');
			expect(stripLeadingSlash('///')).toBe('');
		});
	});

	describe('toVaultPath', () => {
		it('normalizes a folder-control value to a /-prefixed vault path', () => {
			expect(toVaultPath('flashcards')).toBe('/flashcards');
			expect(toVaultPath('/flashcards/')).toBe('/flashcards');
			expect(toVaultPath('  cards/  ')).toBe('/cards');
			expect(toVaultPath('//a//b//')).toBe('/a/b');
		});

		it('falls back to the vault root for an empty value', () => {
			expect(toVaultPath('')).toBe('/');
		});
	});

	describe('toSourceNoteDirectory', () => {
		it('keeps empty empty and normalizes non-empty values to /-prefixed paths', () => {
			expect(toSourceNoteDirectory('')).toBe('');
			expect(toSourceNoteDirectory('   ')).toBe('');
			expect(toSourceNoteDirectory('notes')).toBe('/notes');
			expect(toSourceNoteDirectory('/notes/')).toBe('/notes');
		});
	});

	describe('readControlValue', () => {
		it('converts soft_delete_hours to the dropdown string form', () => {
			expect(readControlValue('soft_delete_hours', 24)).toBe('24');
		});

		it('strips the leading slash for folder controls', () => {
			expect(readControlValue('flashcard.watch.directory', '/flashcards')).toBe('flashcards');
			expect(readControlValue('source_note.watch.directory', '/notes')).toBe('notes');
			expect(readControlValue('source_note.watch.directory', '')).toBe('');
		});

		it('passes other values through', () => {
			expect(readControlValue('flashcard.marker', '?')).toBe('?');
			expect(readControlValue('enable_soft_delete', true)).toBe(true);
		});
	});

	describe('coerceControlValue', () => {
		it('converts the dropdown string back to a number', () => {
			expect(coerceControlValue('soft_delete_hours', '48')).toBe(48);
			expect(coerceControlValue('soft_delete_hours', 12)).toBe(12);
		});

		it('normalizes directory values for the schema', () => {
			expect(coerceControlValue('flashcard.watch.directory', 'flashcards')).toBe('/flashcards');
			expect(coerceControlValue('source_note.watch.directory', '')).toBe('');
			expect(coerceControlValue('source_note.watch.directory', 'notes')).toBe('/notes');
		});

		it('passes other values through unchanged', () => {
			expect(coerceControlValue('flashcard.fsrs.maximum_interval', 100)).toBe(100);
			expect(coerceControlValue('enable_soft_delete', false)).toBe(false);
		});
	});

	describe('parseSteps', () => {
		it('parses a comma-separated list of valid steps', () => {
			expect(parseSteps('1m, 10m')).toEqual({ ok: true, value: ['1m', '10m'] });
			expect(parseSteps('1h,2d')).toEqual({ ok: true, value: ['1h', '2d'] });
		});

		it('rejects an empty list', () => {
			expect(parseSteps('')).toEqual({ ok: false, error: expect.stringContaining('at least one') });
			expect(parseSteps('  ,  ')).toEqual({
				ok: false,
				error: expect.stringContaining('at least one'),
			});
		});

		it('rejects a token that is not a number followed by m, h, or d', () => {
			expect(parseSteps('1m, soon')).toEqual({
				ok: false,
				error: expect.stringContaining('m, h, or d'),
			});
			expect(parseSteps('1')).toEqual({ ok: false, error: expect.stringContaining('m, h, or d') });
		});
	});

	describe('parseTags', () => {
		it('parses and trims comma-separated tags', () => {
			expect(parseTags(' #a , #b ')).toEqual({ ok: true, value: ['#a', '#b'] });
		});

		it('accepts an empty list', () => {
			expect(parseTags('')).toEqual({ ok: true, value: [] });
		});

		it('rejects a tag without a leading #', () => {
			expect(parseTags('#a, b')).toEqual({ ok: false, error: expect.stringContaining("'#'") });
		});
	});

	describe('formatters', () => {
		it('joins arrays for display and tolerates non-arrays', () => {
			expect(formatSteps(['1m', '10m'])).toBe('1m, 10m');
			expect(formatSteps(undefined)).toBe('');
			expect(formatTags(['#a', '#b'])).toBe('#a, #b');
			expect(formatTags(null)).toBe('');
		});
	});
});
