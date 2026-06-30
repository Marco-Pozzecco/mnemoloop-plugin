import type { FlashcardMetadata } from '@/schemas';

export default interface ChartCumulativeCardsProps {
	flashcards: FlashcardMetadata[];
	className?: string;
}
