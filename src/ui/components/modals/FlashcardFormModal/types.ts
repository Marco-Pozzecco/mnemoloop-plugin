import type { ModalController } from '@/ui/controllers/ModalController';
import type { Flashcard } from '@/schemas';

export type FlashcardFormMode = 'create' | 'edit';

export default interface FlashcardFormModalProps {
	controller: ModalController;
	isLoading: boolean;
	error: string | null;
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
