import type { ModalController } from '@/ui/controllers/ModalController';
import type { FlashcardFormMode } from '@/ui/components/compositions/FlashcardForm/Inline/types';
import type { Flashcard } from '@/schemas';

export default interface FlashcardFormModalProps {
	controller: ModalController;
}

/**
 * Data passed via modalStore.data when opening the modal.
 * For edit mode, `card` is the full Flashcard (including content),
 * allowing the form to pre-populate all fields.
 */
export interface FlashcardFormModalData {
	mode: FlashcardFormMode;
	card?: Flashcard;
	prefillSource?: string;
}
