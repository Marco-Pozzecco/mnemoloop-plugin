import type { FlashcardMetadata } from '@/schemas';

export default interface ManageTableRowProps {
	card: FlashcardMetadata;
	preview: string | undefined;
	deckOptions: string[];
	onAddDeck: (deck: string) => void;
	onRemoveDeck: (deck: string) => void;
	onStatusChange: (value: string) => void;
	onEdit: () => void;
	onDelete: () => void;
	className?: string;
}
