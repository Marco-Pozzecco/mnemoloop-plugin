import { describe, expect, it, beforeEach } from 'vitest';
import { FlashcardQuizContentParser } from '@/modules/parsers/content/FlashcardQuizContentParser';
import { CardType, type FlashcardQuizContent } from '@/schemas';
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

describe('QuizContentParser', () => {
	let parser: FlashcardQuizContentParser;

	beforeEach(() => {
		const settings = createSettings();
		parser = new FlashcardQuizContentParser(settings);
	});

	describe('parse', () => {
		it('should parse quiz with one checked option and detect correct_index', () => {
			const result = parser.parse(
				'What is the capital of France?\n?\n- [ ] London\n- [ ] Berlin\n- [x] Paris\n- [ ] Madrid',
			);

			expect(result.success).toBe(true);
			expect(result.entity!.question).toBe('What is the capital of France?');
			expect(result.entity!.options).toEqual(['London', 'Berlin', 'Paris', 'Madrid']);
			expect(result.entity!.correct_index).toBe(2);
			expect(result.entity!.meta_type).toBe('quiz');
		});

		it('should parse checkbox with capital X as checked', () => {
			const result = parser.parse('Q1\n?\n- [X] Option A\n- [ ] Option B');

			expect(result.success).toBe(true);
			expect(result.entity!.options).toEqual(['Option A', 'Option B']);
			expect(result.entity!.correct_index).toBe(0);
		});

		it('should parse quiz with exactly 2 options (minimum)', () => {
			const result = parser.parse('True or false?\n?\n- [ ] False\n- [x] True');

			expect(result.success).toBe(true);
			expect(result.entity!.options).toHaveLength(2);
			expect(result.entity!.correct_index).toBe(1);
		});

		it('should fail when fewer than 2 options', () => {
			const result = parser.parse('Q\n?\n- [x] Only option');

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.message).toBe('Quiz requires at least 2 options');
		});

		it('should fail when no checked option', () => {
			const result = parser.parse('Q\n?\n- [ ] Option A\n- [ ] Option B\n- [ ] Option C');

			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.message).toBe('Quiz requires exactly one checked option');
		});

		it('should fail when more than one checked option', () => {
			const result = parser.parse('Q\n?\n- [x] Option A\n- [x] Option B\n- [ ] Option C');

			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.message).toBe('Quiz requires exactly one checked option');
		});

		it('should fail when marker is missing', () => {
			const result = parser.parse('content without any marker');

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should preserve question text before marker', () => {
			const result = parser.parse(
				'Which planet is closest to the Sun?\n?\n- [x] Mercury\n- [ ] Venus',
			);

			expect(result.success).toBe(true);
			expect(result.entity!.question).toBe('Which planet is closest to the Sun?');
		});

		it('should handle custom marker from settings', () => {
			const settings = createSettings('**');
			parser = new FlashcardQuizContentParser(settings);

			const result = parser.parse('Q\n**\n- [ ] A\n- [x] B');

			expect(result.success).toBe(true);
			expect(result.entity!.options).toEqual(['A', 'B']);
		});

		it('should support plus list markers for options', () => {
			const result = parser.parse('Q\n?\n+ [ ] A\n+ [x] B');

			expect(result.success).toBe(true);
			expect(result.entity!.options).toEqual(['A', 'B']);
			expect(result.entity!.correct_index).toBe(1);
		});

		it('should support asterisk list markers for options', () => {
			const result = parser.parse('Q\n?\n* [ ] A\n* [x] B');

			expect(result.success).toBe(true);
			expect(result.entity!.options).toEqual(['A', 'B']);
		});

		it('preserves multiline table, blank, and fenced-code option bodies through serialization', () => {
			const source = [
				'Question',
				'?',
				'- [ ] first option',
				'  | Name | Value |',
				'  | --- | --- |',
				'  | one | two |',
				'',
				'  ```ts',
				'  const value = 1;',
				'  ```',
				'- [x] second option',
			].join('\n');

			const result = parser.parse(source);

			expect(result.success).toBe(true);
			expect(result.entity!.options).toEqual([
				'first option\n| Name | Value |\n| --- | --- |\n| one | two |\n\n```ts\nconst value = 1;\n```',
				'second option',
			]);
			expect(result.entity!.correct_index).toBe(1);

			const serialized = parser.serialize(result.entity!);
			expect(serialized.success).toBe(true);
			expect(serialized.entity).toBe(
				[
					'Question',
					'',
					'?',
					'',
					'- [ ] first option',
					'  | Name | Value |',
					'  | --- | --- |',
					'  | one | two |',
					'  ',
					'  ```ts',
					'  const value = 1;',
					'  ```',
					'- [x] second option',
				].join('\n'),
			);

			const reparsed = parser.parse(serialized.entity!);
			expect(reparsed.success).toBe(true);
			expect(reparsed.entity).toEqual(result.entity);
		});
	});

	describe('serialize', () => {
		it('should round-trip: serialize then parse yields same content', () => {
			const original = 'What is the capital?\n?\n- [ ] London\n- [x] Paris\n- [ ] Berlin';
			const parseResult = parser.parse(original);

			expect(parseResult.success).toBe(true);

			const serialized = parser.serialize(parseResult.entity!);
			expect(serialized.success).toBe(true);

			const reparsed = parser.parse(serialized.entity!);
			expect(reparsed.success).toBe(true);
			expect(reparsed.entity!.question).toBe(parseResult.entity!.question);
			expect(reparsed.entity!.options).toEqual(parseResult.entity!.options);
			expect(reparsed.entity!.correct_index).toBe(parseResult.entity!.correct_index);
		});

		it('should produce correct option with [x] and others with [ ]', () => {
			const content: FlashcardQuizContent = {
				meta_type: CardType.Quiz,
				question: 'Q',
				options: ['A', 'B', 'C'],
				correct_index: 1,
			};

			const result = parser.serialize(content);
			expect(result.success).toBe(true);

			const expected = 'Q\n\n?\n\n- [ ] A\n- [x] B\n- [ ] C';
			expect(result.entity).toBe(expected);
		});
	});

	describe('cardType', () => {
		it('should be CardType.Quiz', () => {
			expect(parser.cardType).toBe('quiz');
		});
	});
});
