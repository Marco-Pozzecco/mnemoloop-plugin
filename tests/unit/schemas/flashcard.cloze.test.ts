import { describe, expect, it } from 'vitest';
import { FlashcardClozeContentSchema } from '@/schemas/flashcard.cloze';

describe('FlashcardClozeContentSchema', () => {
	it('should accept valid cloze content with single deletion', () => {
		const content = {
			meta_type: 'cloze',
			text: 'The capital of  is France',
			deletions: [{ id: 'c1', answer: 'Paris', hint: null, positions: [14] }],
		};

		const result = FlashcardClozeContentSchema.parse(content);
		expect(result.meta_type).toBe('cloze');
		expect(result.text).toBe('The capital of  is France');
		expect(result.deletions).toHaveLength(1);
		expect(result.deletions[0].id).toBe('c1');
		expect(result.deletions[0].answer).toBe('Paris');
	});

	it('should accept valid cloze content with multiple deletion groups', () => {
		const content = {
			meta_type: 'cloze',
			text: ' is the capital of ',
			deletions: [
				{ id: 'c1', answer: 'Rome', hint: null, positions: [0] },
				{ id: 'c2', answer: 'Italy', hint: null, positions: [19] },
			],
		};

		const result = FlashcardClozeContentSchema.parse(content);
		expect(result.deletions).toHaveLength(2);
	});

	it('should accept valid cloze content with hint', () => {
		const content = {
			meta_type: 'cloze',
			text: ' capital',
			deletions: [{ id: 'c1', answer: 'Paris', hint: 'City of Light', positions: [0] }],
		};

		const result = FlashcardClozeContentSchema.parse(content);
		expect(result.deletions[0].hint).toBe('City of Light');
	});

	it('should reject empty deletions array', () => {
		const content = {
			meta_type: 'cloze',
			text: 'no deletions',
			deletions: [],
		};

		expect(() => FlashcardClozeContentSchema.parse(content)).toThrow();
	});

	it('should reject wrong meta_type', () => {
		const content = {
			meta_type: 'basic',
			text: 'The capital of  is France',
			deletions: [{ id: 'c1', answer: 'Paris', hint: null, positions: [14] }],
		};

		expect(() => FlashcardClozeContentSchema.parse(content)).toThrow();
	});

	it('should accept repeated deletion group with multiple positions', () => {
		const content = {
			meta_type: 'cloze',
			text: ' and ',
			deletions: [{ id: 'c1', answer: 'Paris', hint: null, positions: [0, 4] }],
		};

		const result = FlashcardClozeContentSchema.parse(content);
		expect(result.deletions).toHaveLength(1);
		expect(result.deletions[0].positions).toEqual([0, 4]);
	});
});
