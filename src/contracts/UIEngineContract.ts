import type { Flashcard } from '@/core/parser/types';

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
 * Interface for the Dashboard View controller.
 */
export interface IDashboardController {
  getStats(): Promise<any>;
  refreshStats(): Promise<void>;
  startReviewSession(deckId?: string): Promise<void>;
  updateConfig(config: any): Promise<void>;
}
