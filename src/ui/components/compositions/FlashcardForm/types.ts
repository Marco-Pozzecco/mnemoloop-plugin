import type { CardStatus, Flashcard, FlashcardContent } from '@/schemas';

export interface FlashcardFormSavePayload {
	content: FlashcardContent;
	decks: string[];
	source: string | null;
	/** Only sent in edit mode; a new card starts ACTIVE. */
	status?: CardStatus;
}

export default interface FlashcardFormProps {
	/** `create` starts empty; `edit` seeds from `card`. */
	mode: 'create' | 'edit';
	/** The full card, including content. Required in edit mode. */
	card?: Flashcard;
	/** Human label used by the delete dialog. */
	label?: string;
	/** Every deck in the vault, for suggestions. */
	deckOptions: string[];
	onClose: () => void;
	/** Resolves true when the write succeeded. */
	onSave: (payload: FlashcardFormSavePayload) => Promise<boolean>;
	/** Only shown in edit mode. */
	onDelete?: () => void;
}
