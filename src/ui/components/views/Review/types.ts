import type { Rating } from 'ts-fsrs';

export interface RatingButton {
	value: Rating;
	label: string;
	color: string;
	icon?: string;
	shortcut?: string;
}

export type CardFaceMode = 'front' | 'back' | 'both';

export interface ReviewState {
	currentCard: unknown;
	isAnswerShowing: boolean;
	sessionProgress: number;
	cardsRemaining: number;
	currentIndex: number;
	totalCards: number;
}
