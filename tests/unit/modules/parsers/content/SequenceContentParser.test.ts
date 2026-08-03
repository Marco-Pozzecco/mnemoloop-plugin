import { describe, expect, it, beforeEach } from 'vitest';
import { FlashcardSequenceContentParser } from '@/modules/parsers/content/FlashcardSequenceContentParser';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';

function createSettings(marker: string = '?'): IAdapter<PluginSettings> {
	return {
		data: {
			flashcard: {
				marker,
				watch: { directory: '/flashcards', tags: ['#flashcard'] },
			},
			debounce_timeout_ms: 500,
			enable_soft_delete: true,
			soft_delete_hours: 24,
		},
	} as IAdapter<PluginSettings>;
}

describe('SequenceContentParser', () => {
	let parser: FlashcardSequenceContentParser;

	beforeEach(() => {
		const settings = createSettings();
		parser = new FlashcardSequenceContentParser(settings);
	});

	describe('parse', () => {
		it('should parse content with numbered list steps', () => {
			const result = parser.parse('front\n?\n1. step one\n2. step two\n3. step three');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step one', 'step two', 'step three']);
		});

		it('should parse content with bullet list steps', () => {
			const result = parser.parse('front\n?\n- step a\n- step b\n- step c');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step a', 'step b', 'step c']);
		});

		it('should parse content with plus list steps', () => {
			const result = parser.parse('front\n?\n+ step a\n+ step b');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step a', 'step b']);
		});

		it('should parse content with asterisk list steps', () => {
			const result = parser.parse('front\n?\n* step a\n* step b');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step a', 'step b']);
		});

		it('should parse content with numbered list using parens', () => {
			const result = parser.parse('front\n?\n1) step one\n2) step two');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step one', 'step two']);
		});

		it('should fail when fewer than 2 steps', () => {
			const result = parser.parse('front\n?\n1. step one');

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.message).toBe('Sequence requires at least 2 steps');
		});

		it('should fail when no list items after marker', () => {
			const result = parser.parse('front\n?\nSome text without list items');

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.message).toBe('Sequence requires at least 2 steps');
		});

		it('should fail when marker is missing', () => {
			const result = parser.parse('content without any marker');

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should skip empty lines between steps', () => {
			const result = parser.parse('front\n?\n1. step one\n\n2. step two\n\n3. step three');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step one', 'step two', 'step three']);
		});

		it('should preserve front content before marker (ignored for steps)', () => {
			const result = parser.parse('Front instructions\n?\n1. step one\n2. step two');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step one', 'step two']);
		});

		it('should handle custom marker from settings', () => {
			const settings = createSettings('**');
			parser = new FlashcardSequenceContentParser(settings);

			const result = parser.parse('front\n**\n1. step one\n2. step two');

			expect(result.success).toBe(true);
			expect(result.entity!.steps).toEqual(['step one', 'step two']);
		});
	});

	describe('cardType', () => {
		it('should be CardType.Sequence', () => {
			expect(parser.cardType).toBe('sequence');
		});
	});
});
