import type { FlashcardMetadata } from '@/schemas';

export default interface ManageCardListProps {
	cards: FlashcardMetadata[];
	previews: Record<string, string>;
	hrefFor: (card: FlashcardMetadata) => string;
	onOpen: (card: FlashcardMetadata) => void;
	className?: string;
}
