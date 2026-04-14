import { IModalController } from '@/ui/controllers/ModalController';

export default interface FlashcardModalProps {
	controller: IModalController;
	isLoading: boolean;
	error: string | null;
	initialData: unknown;
}
