import { describe, expect, it } from 'vitest';
import { FlashcardQuizContentSchema, FlashcardQuizSchema } from '@/schemas/flashcard.quiz';
import { DEFAULT_FSRS } from '@/utils/constants';

describe('FlashcardQuizContentSchema', () => {
	it('should accept valid quiz content with valid correct_index', () => {
		const content = {
			meta_type: 'quiz',
			question: 'What is 2+2?',
			options: ['3', '4', '5'],
			correct_index: 1,
		};

		const result = FlashcardQuizContentSchema.parse(content);
		expect(result.question).toBe('What is 2+2?');
		expect(result.options).toEqual(['3', '4', '5']);
		expect(result.correct_index).toBe(1);
	});

	it('should accept minimum 2 options', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Yes or no?',
			options: ['No', 'Yes'],
			correct_index: 0,
		};

		const result = FlashcardQuizContentSchema.parse(content);
		expect(result.options).toHaveLength(2);
	});

	it('should reject correct_index out of bounds', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Q',
			options: ['A', 'B'],
			correct_index: 5,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});

	it('should reject fewer than 2 options', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Q',
			options: ['Only one'],
			correct_index: 0,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});

	it('should reject empty option strings', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Q',
			options: ['A', ''],
			correct_index: 0,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});

	it('should reject negative correct_index', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Q',
			options: ['A', 'B'],
			correct_index: -1,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});

	it('should reject non-integer correct_index', () => {
		const content = {
			meta_type: 'quiz',
			question: 'Q',
			options: ['A', 'B'],
			correct_index: 1.5,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});

	it('should reject wrong meta_type', () => {
		const content = {
			meta_type: 'basic',
			question: 'Q',
			options: ['A', 'B'],
			correct_index: 0,
		};

		expect(() => FlashcardQuizContentSchema.parse(content)).toThrow();
	});
});

describe('FlashcardQuizSchema', () => {
	const baseYaml = {
		...DEFAULT_FSRS,
		uuid: '123e4567-e89b-12d3-a456-426614174000',
		source: null,
		status: 'ACTIVE',
		decks: [],
	};

	it('should parse a valid quiz flashcard', () => {
		const quiz = {
			...baseYaml,
			card_type: 'quiz',
			content: {
				meta_type: 'quiz',
				question: 'Capital of Japan?',
				options: ['Seoul', 'Tokyo', 'Beijing'],
				correct_index: 1,
			},
		};

		const result = FlashcardQuizSchema.parse(quiz);
		expect(result.card_type).toBe('quiz');
		expect(result.content.question).toBe('Capital of Japan?');
		expect(result.content.options).toEqual(['Seoul', 'Tokyo', 'Beijing']);
		expect(result.content.correct_index).toBe(1);
	});

	it('should reject quiz with wrong card_type literal', () => {
		const quiz = {
			...baseYaml,
			card_type: 'basic',
			content: {
				meta_type: 'quiz',
				question: 'Q',
				options: ['A', 'B'],
				correct_index: 0,
			},
		};

		expect(() => FlashcardQuizSchema.parse(quiz)).toThrow();
	});
});
