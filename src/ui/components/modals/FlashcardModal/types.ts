import { ModalController } from '@/ui/controllers/ModalController';

export default interface FlashcardModalProps {
	controller: ModalController;
	isLoading: boolean;
	error: string | null;
}

export interface FlashcardModalData {
	front: string;
	back: string;
	deck: string;
	filepath: string;
}
