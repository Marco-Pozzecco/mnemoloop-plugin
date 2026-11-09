import type { Flashcard } from '@/schemas';
import type { FlashcardFormMode } from '../types';

export type { FlashcardFormMode };

/**
 * The retained modal's flashcard fields, validation and write path. The modal
 * stack is not the capture surface; the sidebar uses the shared form body.
 */
export default interface FlashcardFormInlineProps {
	mode: FlashcardFormMode;
	/** The full card to edit. Required in edit mode. */
	card?: Flashcard;
	/** Create mode: the source link to pre-fill, e.g. `[[notes/biology.md]]`. */
	prefillSource?: string;
	/** A write succeeded. The caller decides whether to navigate, close, or reset. */
	onSaved: (filepath: string) => void;
	/** The user cancelled. No write has happened. */
	onCancel: () => void;
}
