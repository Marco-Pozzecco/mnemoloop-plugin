import { describe, expect, it, vi } from 'vitest';
import { CardType } from '@/schemas';
import {
	buildQuizContent,
	remapCorrectIndexAfterRemove,
	validateQuiz,
} from '@/ui/components/modals/FlashcardFormModal/Content/Quiz/validation';

describe('validateQuiz', () => {
	it('should return error when question is empty', () => {
		expect(validateQuiz('', ['A', 'B'], 0)).toBe('Question is required.');
	});

	it('should return error when question is whitespace-only', () => {
		expect(validateQuiz('   ', ['A', 'B'], 0)).toBe('Question is required.');
	});

	it('should return error when fewer than 2 non-empty options', () => {
		expect(validateQuiz('Q', ['A'], 0)).toBe('At least 2 options are required.');
	});

	it('should return error when 0 non-empty options', () => {
		expect(validateQuiz('Q', ['', ''], 0)).toBe('At least 2 options are required.');
	});

	it('should return error when only 1 of 2 options is non-empty', () => {
		expect(validateQuiz('Q', ['A', ''], 0)).toBe('At least 2 options are required.');
	});

	it('should return error with first empty option index when some options are empty', () => {
		expect(validateQuiz('Q', ['A', '', 'C'], 0)).toBe('Option 2 must be filled.');
	});

	it('should return null for valid input with correct index in bounds', () => {
		expect(validateQuiz('Q', ['A', 'B'], 0)).toBeNull();
	});

	it('should return error when correctIndex is out of bounds (high)', () => {
		expect(validateQuiz('Q', ['A', 'B'], 5)).toBe('Select which option is correct.');
	});

	it('should return error when correctIndex is negative', () => {
		expect(validateQuiz('Q', ['A', 'B'], -1)).toBe('Select which option is correct.');
	});

	it('should return error when correctIndex equals options.length', () => {
		expect(validateQuiz('Q', ['A', 'B'], 2)).toBe('Select which option is correct.');
	});

	it('should return null when correctIndex is 0 for valid options', () => {
		expect(validateQuiz('Q', ['A', 'B', 'C'], 0)).toBeNull();
	});

	it('should return null when correctIndex is last valid index', () => {
		expect(validateQuiz('Q', ['A', 'B', 'C'], 2)).toBeNull();
	});
});

describe('remapCorrectIndexAfterRemove', () => {
	it('should decrement when removed index is before correct index', () => {
		expect(remapCorrectIndexAfterRemove(0, 2)).toBe(1);
	});

	it('should reset to 0 when removed index equals correct index', () => {
		expect(remapCorrectIndexAfterRemove(1, 1)).toBe(0);
	});

	it('should keep same index when removed index is after correct index', () => {
		expect(remapCorrectIndexAfterRemove(2, 1)).toBe(1);
	});

	it('should keep same index when correct index is 0 and removed is after', () => {
		expect(remapCorrectIndexAfterRemove(1, 0)).toBe(0);
	});

	it('should decrement correct index when it is last and removed is first', () => {
		expect(remapCorrectIndexAfterRemove(0, 3)).toBe(2);
	});

	it('should return 0 when removing the only correct option (index 0)', () => {
		expect(remapCorrectIndexAfterRemove(0, 0)).toBe(0);
	});
});

describe('buildQuizContent', () => {
	it('should produce correct payload for valid input', () => {
		const result = buildQuizContent('What is 2+2?', ['3', '4', '5'], 1);
		expect(result).toEqual({
			meta_type: CardType.Quiz,
			question: 'What is 2+2?',
			options: ['3', '4', '5'],
			correct_index: 1,
		});
	});

	it('should trim question and options', () => {
		const result = buildQuizContent('  Q  ', ['  A  ', '  B  '], 0);
		expect(result).toEqual({
			meta_type: CardType.Quiz,
			question: 'Q',
			options: ['A', 'B'],
			correct_index: 0,
		});
	});

	it('should throw when all options are empty (defense-in-depth)', () => {
		expect(() => buildQuizContent('Q', ['', ''], 0)).toThrow(
			'buildQuizContent: no non-empty options after filtering',
		);
	});

	it('should fallback with warning when some options are empty', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = buildQuizContent('Q', ['A', '', 'C'], 0);
		expect(result).toEqual({
			meta_type: CardType.Quiz,
			question: 'Q',
			options: ['A', 'C'],
			correct_index: 0,
		});
		warnSpy.mockRestore();
	});

	it('should fallback with warning when correctIndex is out of bounds', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = buildQuizContent('Q', ['A', 'B', 'C'], 5);
		expect(result).toEqual({
			meta_type: CardType.Quiz,
			question: 'Q',
			options: ['A', 'B', 'C'],
			correct_index: 0,
		});
		warnSpy.mockRestore();
	});
});
