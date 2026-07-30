import { CardType } from '@/schemas';
import type { FlashcardContent } from '@/schemas';

/**
 * Validate sequence form state.
 *
 * Order:
 * 1. Question must be non-empty (after trim).
 * 2. At least 2 non-empty steps required.
 * 3. Every step must be filled.
 *
 * Returns null on success, error string on failure.
 */
export function validateSequence(question: string, steps: string[]): string | null {
	if (!question.trim()) return 'Question is required.';
	if (steps.filter((s) => s.trim()).length < 2) return 'At least 2 steps are required.';
	const firstEmpty = steps.findIndex((s) => !s.trim());
	if (firstEmpty !== -1) return `Step ${firstEmpty + 1} must be filled.`;
	return null;
}

/**
 * Build the FlashcardSequenceContent payload from validated form state.
 *
 * Assumes validation has already passed.  Silently filters out empty steps
 * as defense-in-depth (with a console.warn).
 */
export function buildSequenceContent(question: string, steps: string[]): FlashcardContent {
	const trimmed = steps.map((s) => s.trim());
	const hasEmpty = trimmed.some((s) => s.length === 0);
	if (hasEmpty) {
		console.warn('Sequence buildContent: empty step detected — filtering.');
	}
	return {
		meta_type: CardType.Sequence,
		question: question.trim(),
		steps: hasEmpty ? trimmed.filter((s) => s.length > 0) : trimmed,
	};
}
