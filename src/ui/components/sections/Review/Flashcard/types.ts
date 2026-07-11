import { IReviewItem } from '@/interfaces/IReviewItem';
import type { Flashcard } from '@/schemas';

export default interface FlashCardProps {
	item: IReviewItem<Flashcard>;
	showingAnswer: boolean;
	onShowAnswer: () => void;
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	onTap: () => void;
}

/** Shared shape for per-type content components. */
export interface FlashcardContentProps<T> {
	content: T;
	showingAnswer: boolean;
}
