import type { Flashcard } from '@/core/parser/types';
import { SessionStore } from '@/ui/stores/SessionStore';
import type { BaseComponentProps } from '@/ui/types';
import { App } from 'obsidian';

/**
 * Rating values for flashcard reviews (Again, Hard, Good, Easy)
 */
export type CardRatingValue = 1 | 2 | 3 | 4;

/**
 * Rating button configuration
 */
export interface RatingButton {
	value: CardRatingValue;
	label: string;
	color: string;
	icon?: string;
	shortcut?: string;
}

/**
 * Card face display modes
 */
export type CardFaceMode = 'front' | 'back' | 'both';

/**
 * Review view state
 */
export interface ReviewState {
	currentCard: Flashcard | null;
	isAnswerShowing: boolean;
	sessionProgress: number;
	cardsRemaining: number;
	currentIndex: number;
	totalCards: number;
}

/**
 * Props for Review component
 */
export interface ReviewProps extends BaseComponentProps {
	app: App;
	onShowAnswer: () => void;
	onSubmitRating: (rating: CardRatingValue) => void;
	onNextCard: () => void;
	onPreviousCard: () => void;
	onEndSession: () => void;
	onEditCard: () => void;
	disabled: boolean;
	sessionStore: SessionStore;
}

/**
 * Props for CardFace component
 */
export interface CardFaceProps extends BaseComponentProps {
	front: string;
	back?: string;
	mode: CardFaceMode;
	onFlip?: () => void;
	onEdit?: () => void;
	showEditButton?: boolean;
}
