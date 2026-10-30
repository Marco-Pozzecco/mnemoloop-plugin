import type { FlashcardMetadata } from '@/schemas';

export default interface ManageResultsProps {
	cards: FlashcardMetadata[];
	previews: Record<string, string>;
	hrefFor: (card: FlashcardMetadata) => string;
	/** The card whose sheet is open, if any. */
	selectedUuid?: string | null;
	isLoading: boolean;
	totalCount: number;
	visibleCount: number;
	onOpen: (card: FlashcardMetadata) => void;
	onAdd: () => void;
	onReset: () => void;
	className?: string;
}
