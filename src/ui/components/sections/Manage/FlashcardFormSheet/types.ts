import type { Flashcard } from '@/schemas';
import type { FlashcardFormSavePayload } from '@/ui/components/compositions/FlashcardForm/types';

export default interface FlashcardFormSheetProps {
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
