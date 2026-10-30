import type { FlashcardMetadata } from '@/schemas';

export default interface ManageTableRowProps {
	card: FlashcardMetadata;
	preview: string | undefined;
	/** Vault deep link for the card's note; modifier-click opens it. */
	href: string;
	selected?: boolean;
	onOpen: () => void;
	className?: string;
}
