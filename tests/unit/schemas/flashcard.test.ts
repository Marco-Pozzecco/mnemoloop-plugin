import { describe, expect, it } from 'vitest';
import { FlashcardYamlSchema, DEFAULT_FLASHCARD_YAML } from '@/schemas/flashcard';
import { DEFAULT_FSRS } from '@/utils/constants';

describe('FlashcardYamlSchema', () => {
	const baseYaml = {
		...DEFAULT_FSRS,
		uuid: '123e4567-e89b-12d3-a456-426614174000',
		source: null,
		status: 'ACTIVE',
	};

	it('should throw error when YAML without decks field', () => {
		const yaml = { ...baseYaml };
		expect(() => FlashcardYamlSchema.parse(yaml)).toThrow();
	});

	it('should parse YAML with decks array and preserve value', () => {
		const yaml = {
			...baseYaml,
			decks: ['Maths::Linear algebra'],
		};
		const result = FlashcardYamlSchema.parse(yaml);
		expect(result.decks).toEqual(['Maths::Linear algebra']);
	});

	it('should parse YAML with multiple decks', () => {
		const yaml = {
			...baseYaml,
			decks: ['Maths::LA', 'CS::Algorithms'],
		};
		const result = FlashcardYamlSchema.parse(yaml);
		expect(result.decks).toEqual(['Maths::LA', 'CS::Algorithms']);
	});

	it('should parse YAML with empty decks array', () => {
		const yaml = {
			...baseYaml,
			decks: [],
		};
		const result = FlashcardYamlSchema.parse(yaml);
		expect(result.decks).toEqual([]);
	});

	it('should reject invalid decks type', () => {
		const yaml = {
			...baseYaml,
			decks: 'Maths',
		};
		expect(() => FlashcardYamlSchema.parse(yaml)).toThrow();
	});

	it('should reject non-string array elements in decks', () => {
		const yaml = {
			...baseYaml,
			decks: ['Maths', 123],
		};
		expect(() => FlashcardYamlSchema.parse(yaml)).toThrow();
	});
});

describe('DEFAULT_FLASHCARD_YAML', () => {
	it('should include empty decks array', () => {
		expect(DEFAULT_FLASHCARD_YAML.decks).toEqual([]);
	});
});
