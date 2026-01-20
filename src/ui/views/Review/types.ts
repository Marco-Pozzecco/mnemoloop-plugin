import type { Flashcard } from '@/core/parser/utils/types';
import { SessionStore } from '@/ui/stores/SessionStore';
import type { BaseComponentProps } from '@/ui/types';
import { App } from 'obsidian';

/**
 * Interface for the Review View controller.
 * Handles business logic for flashcard reviews.
 */
export interface IReviewController {
	/**
	 * Gets the next card to review from the session.
	 */
	getNextCard(): Promise<Flashcard | null>;

	/**
	 * Submits a rating for a card.
	 * @param cardId - The ID of the card being rated
	 * @param rating - The rating value (1-4)
	 */
	submitRating(cardId: string, rating: 1 | 2 | 3 | 4): Promise<void>;

	/**
	 * Opens the source file for a card in the editor.
	 * @param cardId - The ID of the card to edit
	 */
	editSource(cardId: string): Promise<void>;

	/**
	 * Verifies a card's state and resets it if necessary (e.g., if it's stale).
	 * @param cardId - The ID of the card to verify
	 */
	verifyAndReset(cardId: string): Promise<void>;
}

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
