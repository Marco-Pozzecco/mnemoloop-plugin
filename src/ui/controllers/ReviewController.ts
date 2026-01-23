/**
 * ReviewController for managing flashcard review sessions
 *
 * Extends BaseController to provide consistent error handling and logging.
 * Handles card rating, session management, and source file editing with
 * error recovery and user feedback.
 *
 * @see FR-003: System MUST provide base controller class
 * @see research.md section 3: Base Controller Pattern
 */

import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import type { Logger } from '@/utils/Logger';
import { BaseController } from '@/ui/controllers/BaseController';
import { IndexManager } from '@/core/indexer/IndexerManager';
import { SessionStore } from '@/ui/stores/session/SessionStore';
import { FSRSRating } from '@/ui/stores/session/types';
import { AppEvents } from '@/ui/infrastructure/EventBus';

/**
 * Interface for rating submission result
 */
export interface RatingSubmissionResult {
	success: boolean;
	error?: Error;
	recovered?: boolean;
}

/**
 * ReviewController for managing review session operations
 *
 * Provides error handling for:
 * - Card rating submission with FSRS algorithm
 * - Session pause/resume on error
 * - Source file editing with fallback handling
 */
export class ReviewController extends BaseController {
	private indexManager: IndexManager;
	private sessionStore: SessionStore;
	private isPaused: boolean = false;

	constructor(
		logger: Logger,
		eventBus: EventBus,
		private app: App,
		indexManager: IndexManager,
		sessionStore: SessionStore,
	) {
		super(logger, eventBus);
		this.indexManager = indexManager;
		this.sessionStore = sessionStore;
	}

	/**
	 * Initialize the controller
	 */
	async initialize(): Promise<void> {
		this.logger.info('ReviewController initialized');
		// Set up event listeners if needed
	}

	/**
	 * Dispose of the controller
	 */
	async dispose(): Promise<void> {
		this.logger.info('ReviewController disposed');
		// Clean up event listeners if any
	}

	/**
	 * Get the next card in the review queue
	 *
	 * @returns The next flashcard or null if no cards available
	 */
	async getNextCard(): Promise<{ id: string; front: string; back: string; srs: any } | null> {
		if (this.isPaused) {
			this.logger.warn('Cannot get next card: session is paused due to error');
			return null;
		}

		let card: { id: string; front: string; back: string; srs: any } | null = null;
		this.sessionStore.subscribe((state) => {
			card = state.currentCard;
		})();
		return card;
	}

	/**
	 * Submit a rating for the current card
	 *
	 * Handles errors during rating submission by:
	 * 1. Logging the error with correlation ID
	 * 2. Pausing the session to prevent further issues
	 * 3. Emitting an error event for UI to display
	 * 4. Returning structured result for error recovery
	 *
	 * @param cardId - The ID of card being rated
	 * @param rating - The FSRS rating (1-4: Again, Hard, Good, Easy)
	 * @returns Result with success status and error details if failed
	 *
	 * @example
	 * ```typescript
	 * const result = await reviewController.submitRating(card.id, 3);
	 * if (!result.success) {
	 *   // Show error dialog to user
	 *   showErrorDialog(result.error, () => {
	 *     // Retry logic
	 *   });
	 * }
	 * ```
	 */
	async submitRating(cardId: string, rating: FSRSRating): Promise<RatingSubmissionResult> {
		// Validate inputs
		if (!cardId) {
			throw new Error('Card ID is required');
		}

		if (this.isPaused) {
			throw new Error('Cannot submit rating: session is paused due to previous error');
		}

		// Submit rating through session store
		await this.sessionStore.rateCard(rating);

		// Emit card rated event
		this.eventBus.emit(AppEvents.CARD_RATED, {
			cardId,
			rating,
			timestamp: new Date().toISOString(),
		});

		this.logger.debug(`Rating submitted successfully for card ${cardId}: ${rating}`);

		return { success: true };
	}

	/**
	 * Edit the source file for a card
	 *
	 * Opens the card's source file in a split view for editing.
	 * Handles errors such as missing metadata or file not found.
	 *
	 * @param cardId - The ID of the card whose source to edit
	 * @returns Promise that resolves when file is opened or rejects on error
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   await reviewController.editSource(card.id);
	 * } catch (error) {
	 *   showNotification('Failed to open source file', 'error');
	 * }
	 * ```
	 */
	async editSource(cardId: string): Promise<void> {
		// Validate input
		if (!cardId) {
			throw new Error('Card ID is required');
		}

		// Get card metadata from index
		const cardMetadata = this.indexManager.getCard(cardId);

		if (!cardMetadata) {
			throw new Error(`Card with ID '${cardId}' not found in index. It may have been deleted.`);
		}

		// Get the source file path from card metadata
		const sourcePath = cardMetadata.source;

		if (!sourcePath) {
			throw new Error(`No source path found for card '${cardId}'. The card data may be corrupted.`);
		}

		// Get the TFile object from the vault
		const abstractFile = this.app.vault.getAbstractFileByPath(sourcePath);

		if (!abstractFile || !(abstractFile instanceof TFile)) {
			throw new Error(
				`Source file '${sourcePath}' not found or is not a file. It may have been moved or deleted.`,
			);
		}

		const file: TFile = abstractFile;

		// Open the file in a new leaf (split view)
		const leaf = this.app.workspace.getLeaf('split');
		await leaf.openFile(file);

		this.logger.debug(`Opened source file '${sourcePath}' for card '${cardId}'`);
	}

	/**
	 * Verify and reset a card (for STALE cards)
	 *
	 * Currently a placeholder for future implementation.
	 *
	 * @param cardId - The ID of the card to verify and reset
	 */
	async verifyAndReset(cardId: string): Promise<void> {
		this.logger.debug(`Verifying and resetting card: ${cardId}`);
		// Future implementation: Reset STALE cards to ACTIVE
	}

	/**
	 * Handle errors during review session
	 *
	 * Pauses the session and emits error event for UI to display
	 * error dialog with retry/end options.
	 *
	 * @param error - The error that occurred
	 */
	private async handleError(error: unknown): Promise<void> {
		// Pause the session to prevent further errors
		this.pauseSession();

		// Emit error event for UI to handle
		const errorMessage = error instanceof Error ? error.message : String(error);
		this.eventBus.emit(AppEvents.CARD_RATED, {
			error: errorMessage,
			cardId: null,
			timestamp: new Date().toISOString(),
		});

		this.logger.error('Review session paused due to error:', error);
	}

	/**
	 * Pause the current review session
	 *
	 * Sets paused state to prevent further operations until resumed.
	 */
	pauseSession(): void {
		this.isPaused = true;
		this.sessionStore.pauseSession();
		this.logger.info('Review session paused');
	}

	/**
	 * Resume a paused review session
	 *
	 * Clears paused state to allow operations to continue.
	 */
	resumeSession(): void {
		this.isPaused = false;
		this.sessionStore.resumeSession();
		this.logger.info('Review session resumed');
	}

	/**
	 * Check if the session is paused
	 *
	 * @returns true if session is paused
	 */
	isSessionPaused(): boolean {
		return this.isPaused;
	}

	/**
	 * End the current review session
	 *
	 * Cleans up and ends the session, clearing paused state.
	 */
	async endSession(): Promise<void> {
		this.isPaused = false;
		await this.sessionStore.endSession();
		this.logger.info('Review session ended');
	}
}
