import { describe, expect, it } from 'vitest';
import { CardType } from '@/schemas';
import {
	buildClozeContent,
	validateCloze,
} from '@/ui/components/modals/FlashcardFormModal/Content/Cloze/validation';

describe('validateCloze', () => {
	it('should return error when no cloze marker is present', () => {
		expect(validateCloze('Plain text')).toBe('At least one {{c1::answer}} marker is required.');
	});
});

describe('buildClozeContent', () => {
	it('should produce the deletion-free canonical payload', () => {
		expect(buildClozeContent('Test {{c1::cloze::hint}}')).toEqual({
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
	});
});
