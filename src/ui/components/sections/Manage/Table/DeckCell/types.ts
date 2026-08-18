import type { FlashcardMetadata } from '@/schemas';

export default interface ManageDeckCellProps {
	card: FlashcardMetadata;
	deckOptions: string[];
	onAddDeck: (deck: string) => void;
	onRemoveDeck: (deck: string) => void;
	className?: string;
}
