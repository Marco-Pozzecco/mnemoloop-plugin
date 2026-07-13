import { IReviewItem } from '@/interfaces/IReviewItem';
import type { Flashcard } from '@/schemas';
import type { Rating } from 'ts-fsrs';

export default interface FlashCardProps {
	item: IReviewItem<Flashcard>;
	showingAnswer: boolean;
	onShowAnswer: () => void;
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	onTap: () => void;
	onSubmitRating: (rating: Rating) => void;
}
