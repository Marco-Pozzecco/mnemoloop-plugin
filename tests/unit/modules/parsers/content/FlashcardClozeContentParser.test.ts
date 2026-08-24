import { describe, expect, it, beforeEach } from 'vitest';
import { FlashcardClozeContentParser } from '@/modules/parsers/content/FlashcardClozeContentParser';
import { IAdapter } from '@/interfaces/IAdapter';
import { CardType } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';

function createSettings(): IAdapter<PluginSettings> {
	return {
		data: {
			flashcard: {
				marker: '?',
				watch: { directory: '/flashcards', tags: ['#flashcard'] },
			},
			debounce_timeout_ms: 500,
			enable_soft_delete: true,
			soft_delete_hours: 24,
		},
	} as IAdapter<PluginSettings>;
}

describe('ClozeContentParser', () => {
	let parser: FlashcardClozeContentParser;

	beforeEach(() => {
		const settings = createSettings();
		parser = new FlashcardClozeContentParser(settings);
	});

	describe('parse', () => {
		it('should parse single deletion', () => {
			const result = parser.parse('The capital of {{c1::Paris}} is France');

			expect(result.success).toBe(true);
			expect(result.entity!.text).toBe('The capital of  is France');
			expect(result.entity!.deletions).toHaveLength(1);
			expect(result.entity!.deletions[0].id).toBe('c1');
			expect(result.entity!.deletions[0].answer).toBe('Paris');
			expect(result.entity!.deletions[0].positions).toEqual([15]);
		});

		it('should parse deletion with hint', () => {
			const result = parser.parse('{{c1::Eiffel Tower::famous landmark}}');

			expect(result.success).toBe(true);
			expect(result.entity!.deletions[0].hint).toBe('famous landmark');
		});

		it('should parse multiple deletion groups', () => {
			const result = parser.parse('{{c1::Rome}} is the capital of {{c2::Italy}}');

			expect(result.success).toBe(true);
			expect(result.entity!.deletions).toHaveLength(2);
			expect(result.entity!.deletions[0].id).toBe('c1');
			expect(result.entity!.deletions[0].answer).toBe('Rome');
			expect(result.entity!.deletions[1].id).toBe('c2');
			expect(result.entity!.deletions[1].answer).toBe('Italy');
		});

		it('should parse repeated deletion group', () => {
			const result = parser.parse('{{c1::Paris}} and {{c1::Paris}}');

			expect(result.success).toBe(true);
			expect(result.entity!.deletions).toHaveLength(1);
			expect(result.entity!.deletions[0].id).toBe('c1');
			expect(result.entity!.deletions[0].positions).toHaveLength(2);
		});

		it('should return error for no deletions', () => {
			const result = parser.parse('no cloze here');

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should round-trip parse → serialize → parse', () => {
			const input = 'The capital of {{c1::Paris}} is {{c2::France::hint}}';
			const parsed1 = parser.parse(input);
			expect(parsed1.success).toBe(true);

			const serialized = parser.serialize(parsed1.entity!);
			expect(serialized.success).toBe(true);

			const parsed2 = parser.parse(serialized.entity!);
			expect(parsed2.success).toBe(true);
			expect(parsed2.entity!.text).toBe(parsed1.entity!.text);
			expect(parsed2.entity!.deletions).toHaveLength(parsed1.entity!.deletions.length);
		});
	});

	describe('serialize', () => {
		it('should serialize the canonical form payload without duplicate markers', () => {
			const result = parser.serialize({
				meta_type: CardType.Cloze,
				text: 'Test ',
				deletions: [
					{
						id: 'c1',
						answer: 'cloze',
						hint: 'hint',
						positions: [5],
					},
				],
			});

			expect(result.success).toBe(true);
			expect(result.entity).toBe('Test {{c1::cloze::hint}}');
		});
	});

	describe('cardType', () => {
		it('should be CardType.Cloze', () => {
			expect(parser.cardType).toBe('cloze');
		});
	});
});
