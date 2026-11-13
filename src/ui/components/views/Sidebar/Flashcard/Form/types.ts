import type { Flashcard } from '@/schemas';
import type {
	FlashcardFormMode,
	FlashcardFormSavePayload,
} from '@/ui/components/compositions/FlashcardForm/types';

/**
 * The sidebar panel's flashcard form. The surface owns the title, note context
 * and footer; the shared form body owns the fields.
 */
export default interface SidebarFlashcardFormProps {
	mode: FlashcardFormMode;
	/** The full card to edit. Required in edit mode. */
	card?: Flashcard;
	/** Create mode: the source link to pre-fill, e.g. `[[notes/biology.md]]`. */
	prefillSource?: string;
	/** The note the form is bound to, shown under the form title. */
	contextLabel?: string;
	/** Edit mode: the card label used by the delete dialog. */
	label?: string;
	/** Every deck in the vault, for suggestions. */
	deckOptions: string[];
	onClose: () => void;
	/** Resolves true when the write succeeded. */
	onSave: (payload: FlashcardFormSavePayload) => Promise<boolean>;
	/** Edit mode only. The surface owns the delete request. */
	onDelete?: () => void;
}
