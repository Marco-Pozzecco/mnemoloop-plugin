import type { Flashcard } from '@/schemas';

export type FlashcardFormMode = 'create' | 'edit';

/**
 * The flashcard fields, validation and write path, shared by the modal and the
 * sidebar panel. The form owns its own saving and error state; the caller only
 * decides what happens after a save (`onSaved`) or a cancel (`onCancel`).
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
