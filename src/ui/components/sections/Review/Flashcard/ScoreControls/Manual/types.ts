import type { Rating } from 'ts-fsrs';

export default interface ManualReviewControlsProps {
	disabled?: boolean;
	onSubmitRating: (rating: Rating) => void;
}
