import type { FlashcardMetadata } from '@/schemas';

export default interface ManageResultsProps {
	isLoading: boolean;
	totalCount: number;
	visibleCount: number;
	cards: FlashcardMetadata[];
	previews: Record<string, string>;
	deckOptions: string[];
	onAddDeck: (card: FlashcardMetadata, deck: string) => void;
	onRemoveDeck: (card: FlashcardMetadata, deck: string) => void;
	onStatusChange: (card: FlashcardMetadata, value: string) => void;
	onEdit: (card: FlashcardMetadata) => void;
	onDelete: (card: FlashcardMetadata) => void;
	onAdd: () => void;
	onReset: () => void;
	className?: string;
}
