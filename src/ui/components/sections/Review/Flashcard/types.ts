import { IReviewItem } from '@/interfaces/IReviewItem';
import type { Flashcard } from '@/schemas';
import type { Rating } from 'ts-fsrs';

export default interface FlashCardProps {
	item: IReviewItem<Flashcard>;
	isAnswerShowing: boolean;
	isAnswerCorrect: boolean;
	onShowAnswer: () => void;
	onSubmitRating: (rating: Rating) => void;
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	onTap: () => void;
	onSetAnswerCorrectness: (isCorrect: boolean) => void;
}
