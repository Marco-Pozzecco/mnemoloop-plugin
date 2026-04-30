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
