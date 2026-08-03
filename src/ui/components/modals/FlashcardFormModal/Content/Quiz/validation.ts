import { CardType } from '@/schemas';
import type { FlashcardContent } from '@/schemas';

/**
 * Validate quiz form state.
 *
 * Order:
 * 1. Question must be non-empty (after trim).
 * 2. At least 2 non-empty options required.
 * 3. Every option must be filled.
 * 4. correctIndex must be a valid index.
 *
 * Returns null on success, error string on failure.
 */
export function validateQuiz(
	question: string,
	options: string[],
	correctIndex: number,
): string | null {
	if (!question.trim()) return 'Question is required.';
	if (options.filter((o) => o.trim()).length < 2) return 'At least 2 options are required.';
	const firstEmpty = options.findIndex((o) => !o.trim());
	if (firstEmpty !== -1) return `Option ${firstEmpty + 1} must be filled.`;
	if (correctIndex < 0 || correctIndex >= options.length) return 'Select which option is correct.';
	return null;
}

/**
 * Build the FlashcardQuizContent payload from validated form state.
 *
 * Assumes validation has already passed.  As defense-in-depth, if the
 * filtered options array is empty (should never happen after validation),
 * throws an Error to surface the programming error early.
 */
export function buildQuizContent(
	question: string,
	options: string[],
	correctIndex: number,
): FlashcardContent {
	const trimmedOptions = options.map((o) => o.trim());
	const filtered = trimmedOptions.filter((o) => o.length > 0);

	if (filtered.length === 0) {
		throw new Error(
			'buildQuizContent: no non-empty options after filtering — this should never happen if validation passed.',
		);
	}

	const allFilled = trimmedOptions.every((o) => o.length > 0);
	const validIndex = correctIndex >= 0 && correctIndex < options.length;

	if (!allFilled || !validIndex) {
		console.warn(
			'Quiz buildContent: invalid state — options have empties or correctIndex out of bounds. Falling back.',
		);
		return {
			meta_type: CardType.Quiz,
			question: question.trim(),
			options: filtered,
			correct_index: 0,
		};
	}

	return {
		meta_type: CardType.Quiz,
		question: question.trim(),
		options: trimmedOptions,
		correct_index: correctIndex,
	};
}

/**
 * Recalculate correctIndex after removing an option at `removedIndex`.
 *
 * - If the removed option was the correct one, reset to 0.
 * - If the correct option was after the removed one, shift down by 1.
 * - Otherwise keep the same index.
 */
export function remapCorrectIndexAfterRemove(
	removedIndex: number,
	currentCorrectIndex: number,
): number {
	if (removedIndex === currentCorrectIndex) return 0;
	if (removedIndex < currentCorrectIndex) return currentCorrectIndex - 1;
	return currentCorrectIndex;
}
