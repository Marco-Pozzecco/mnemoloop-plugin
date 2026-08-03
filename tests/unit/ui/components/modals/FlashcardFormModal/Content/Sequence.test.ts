import { describe, expect, it } from 'vitest';
import { CardType } from '@/schemas';
import {
	buildSequenceContent,
	validateSequence,
} from '@/ui/components/modals/FlashcardFormModal/Content/Sequence/validation';

describe('validateSequence', () => {
	it('should return error when question is empty', () => {
		expect(validateSequence('', ['A', 'B'])).toBe('Question is required.');
	});

	it('should return error when question is whitespace-only', () => {
		expect(validateSequence('   ', ['A', 'B'])).toBe('Question is required.');
	});

	it('should return error when fewer than 2 non-empty steps', () => {
		expect(validateSequence('Q', ['A'])).toBe('At least 2 steps are required.');
	});

	it('should return error when 0 non-empty steps', () => {
		expect(validateSequence('Q', ['', ''])).toBe('At least 2 steps are required.');
	});

	it('should return error when only 1 of 2 steps is non-empty', () => {
		expect(validateSequence('Q', ['A', ''])).toBe('At least 2 steps are required.');
	});

	it('should return error with first empty step index when some steps are empty', () => {
		expect(validateSequence('Q', ['A', '', 'C'])).toBe('Step 2 must be filled.');
	});

	it('should return null for valid input with 2 non-empty steps', () => {
		expect(validateSequence('Q', ['A', 'B'])).toBeNull();
	});

	it('should return null for valid input with many steps', () => {
		expect(validateSequence('Q', ['A', 'B', 'C', 'D', 'E'])).toBeNull();
	});

	it('should detect the correct empty index in a longer list', () => {
		expect(validateSequence('Q', ['Step 1', '', 'Step 3', 'Step 4', ''])).toBe(
			'Step 2 must be filled.',
		);
	});
});

describe('buildSequenceContent', () => {
	it('should produce correct payload for valid input', () => {
		const result = buildSequenceContent('My question', ['Step A', 'Step B', 'Step C']);
		expect(result).toEqual({
			meta_type: CardType.Sequence,
			question: 'My question',
			steps: ['Step A', 'Step B', 'Step C'],
		});
	});

	it('should trim question and steps', () => {
		const result = buildSequenceContent('  Q  ', ['  A  ', '  B  ']);
		expect(result).toEqual({
			meta_type: CardType.Sequence,
			question: 'Q',
			steps: ['A', 'B'],
		});
	});

	it('should produce correct payload for minimum valid input (2 steps)', () => {
		const result = buildSequenceContent('Q', ['First', 'Second']);
		expect(result).toEqual({
			meta_type: CardType.Sequence,
			question: 'Q',
			steps: ['First', 'Second'],
		});
	});
});
