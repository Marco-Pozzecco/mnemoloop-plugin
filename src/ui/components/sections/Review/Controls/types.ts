import type { Rating } from 'ts-fsrs';

export default interface RatingControlsProps {
	onSubmitRating: (rating: Rating) => void;
	disabled?: boolean;
}

export interface RatingButton {
	value: Rating;
	label: string;
	color: string;
	icon?: string;
	shortcut?: string;
}
