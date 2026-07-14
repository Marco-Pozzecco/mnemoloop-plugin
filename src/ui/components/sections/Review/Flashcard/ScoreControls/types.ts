import { CardType } from '@/schemas';
import type { Rating } from 'ts-fsrs';

export interface RatingButton {
	value: Rating;
	label: string;
	color: string;
	icon?: string;
	shortcut?: string;
}

export default interface ScoreControlsProps {
	disabled?: boolean;
	type?: CardType;
	isAnswerShowing: boolean;
	isAnswerCorrect: boolean;
	onShowAnswer: () => void;
	onSubmitRating: (rating: Rating) => void;
}
