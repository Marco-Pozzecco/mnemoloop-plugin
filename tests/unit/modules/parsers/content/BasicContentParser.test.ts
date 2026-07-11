import { describe, expect, it, beforeEach } from 'vitest';
import { FlashcardBasicContentParser } from '@/modules/parsers/content/FlashcardBasicContentParser';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';

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

describe('BasicContentParser', () => {
	let parser: FlashcardBasicContentParser;

	beforeEach(() => {
		const settings = createSettings();
		parser = new FlashcardBasicContentParser(settings);
	});

	describe('parse', () => {
		it('should split content into front and back using default marker', () => {
			const result = parser.parse('front\n?\nback');

			expect(result.success).toBe(true);
			expect(result.entity!.front).toBe('front');
			expect(result.entity!.back).toBe('back');
		});

		it('should return error result when marker is missing', () => {
			const result = parser.parse('no marker here');

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
			if (!result.success) expect(result.error.message).toBe(ERROR_MESSAGES.MISSING_MARKER);
		});

		it('should return error when front content is empty', () => {
			const result = parser.parse('\n?\nback');

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.message).toBe('no content found');
		});

		it('should return error when back content is empty', () => {
			const result = parser.parse('front\n?\n');

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.message).toBe('no content found');
		});

		it('should use custom marker from settings', () => {
			const settings = createSettings('**');
			parser = new FlashcardBasicContentParser(settings);

			const result = parser.parse('front\n**\nback');

			expect(result.success).toBe(true);
			expect(result.entity!.front).toBe('front');
			expect(result.entity!.back).toBe('back');
		});

		it('should handle marker with regex special characters like [', () => {
			const settings = createSettings('[split]');
			parser = new FlashcardBasicContentParser(settings);

			const result = parser.parse('front\n[split]\nback');

			expect(result.success).toBe(true);
			expect(result.entity!.front).toBe('front');
			expect(result.entity!.back).toBe('back');
		});

		it('should handle marker with regex special characters like *', () => {
			const settings = createSettings('**');
			parser = new FlashcardBasicContentParser(settings);

			const result = parser.parse('front\n**\nback');

			expect(result.success).toBe(true);
			expect(result.entity!.front).toBe('front');
			expect(result.entity!.back).toBe('back');
		});
	});

	describe('cardType', () => {
		it('should be CardType.Basic', () => {
			expect(parser.cardType).toBe('basic');
		});
	});
});
