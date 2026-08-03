import { Rating } from 'ts-fsrs';

export default interface AutoReviewControlsProps {
	isAnswerCorrect: boolean;
	disabled?: boolean;
	onSubmitRating: (rating: Rating) => void;
}
