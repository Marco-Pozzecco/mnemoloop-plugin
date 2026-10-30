import type { FlashcardMetadata } from '@/schemas';

export default interface ManageTableProps {
	cards: FlashcardMetadata[];
	previews: Record<string, string>;
	/** Vault deep link for each card's note. */
	hrefFor: (card: FlashcardMetadata) => string;
	/** The card whose sheet is open, if any. */
	selectedUuid?: string | null;
	onOpen: (card: FlashcardMetadata) => void;
}
