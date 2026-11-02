import { FlashcardMetadata } from '@/schemas';

export default interface SidebarFlashcardCard {
	card: FlashcardMetadata;
	preview: string;
	className?: string;
}
