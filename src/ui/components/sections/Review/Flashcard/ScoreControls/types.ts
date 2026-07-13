import type { Rating } from 'ts-fsrs';
import type { CardType } from '@/schemas';

export interface RatingButton {
	value: Rating;
	label: string;
	color: string;
	icon?: string;
	shortcut?: string;
}

export default interface ScoreControlsProps {
	cardType: CardType;
	disabled?: boolean;
	onSubmitRating: (rating: Rating) => void;
	onContinue: () => void;
	/** the auto-computed correctness, used for button styling. */
	isCorrect?: boolean;
}
