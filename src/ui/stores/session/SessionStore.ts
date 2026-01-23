import { writable, type Writable } from 'svelte/store';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/utils/Logger';
import type { SessionState, FSRSRating } from './types';

/**
 * Default initial state for session store
 */
const DEFAULT_STATE: SessionState = {
	activeSession: null,
	currentCard: null,
	queue: [],
	isAnswerShowing: false,
	progress: {
		currentIndex: 0,
		total: 0,
		percentage: 0,
	},
};

/**
 * Dependencies required by SessionStore
 */
export interface SessionStoreDependencies {
	eventBus: EventBus;
	indexManager: any;
	statsManager: any;
	dueQueueManager: any;
}

/**
 * Session Store for managing flashcard review sessions.
 *
 * Handles the complete lifecycle of review sessions including:
 * - Session initialization and queue generation
 * - Card navigation and rating submission
 * - Progress tracking and session persistence
 * - Integration with FSRS algorithm and core indexing
 * - EventBus integration for cross-component communication
 */
export class SessionStore {
	private readonly _state: Writable<SessionState>;
	private readonly eventBus: EventBus;
	private readonly indexManager: any;
	private readonly statsManager: any;
	private readonly dueQueueManager: any;
	private sessionTimer?: ReturnType<typeof setInterval>;

	constructor(dependencies: SessionStoreDependencies) {
		this._state = writable(DEFAULT_STATE);
		this.eventBus = dependencies.eventBus;
		this.indexManager = dependencies.indexManager;
		this.statsManager = dependencies.statsManager;
		this.dueQueueManager = dependencies.dueQueueManager;

		Logger.debug('SessionStore initialized');
	}

	/**
	 * Subscribe to session state changes
	 */
	subscribe(run: (value: SessionState) => void) {
		return this._state.subscribe(run);
	}

	/**
	 * Gets the current state snapshot
	 */
	get state(): SessionState {
		let currentState: SessionState | null = null;
		this._state.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}

	/**
	 * Starts a new review session
	 *
	 * @returns Promise that resolves when session is initialized
	 */
	async startSession(): Promise<void> {
		try {
			Logger.info('Starting new review session');

			// Clear any existing session
			await this.endSession();

			// Generate due queue
			const queue = await this.dueQueueManager.generate();

			if (queue.cards.length === 0) {
				Logger.warn('No cards due for review');
				return;
			}

			// Create new session
			const sessionId = crypto.randomUUID();

			// Update state
			this._state.set({
				activeSession: {
					sessionId,
					startTime: new Date().toISOString(),
					isComplete: false,
				},
				currentCard: queue.cards[0],
				queue: queue.cards,
				isAnswerShowing: false,
				progress: {
					currentIndex: 0,
					total: queue.cards.length,
					percentage: 0,
				},
			});

			// Start session timer
			this.startSessionTimer();

			// Emit event
			this.eventBus.emit(AppEvents.SESSION_STARTED, {
				sessionId,
				queueSize: queue.cards.length,
				startTime: Date.now(),
			});

			Logger.info(`Session started with ${queue.cards.length} cards`);
		} catch (error) {
			Logger.error('Failed to start review session:', error);
			throw error;
		}
	}

	/**
	 * Submits a rating for the current card and advances to the next card
	 *
	 * @param rating - The FSRS rating (1-4: Again, Hard, Good, Easy)
	 * @returns Promise that resolves when rating is processed
	 */
	async rateCard(rating: FSRSRating): Promise<void> {
		try {
			const currentState = this.state;

			if (!currentState.activeSession || !currentState.currentCard) {
				throw new Error('No active session or current card');
			}

			Logger.debug(`Rating card ${currentState.currentCard.id} with rating ${rating}`);

			// TODO: Integrate with FSRS controller to calculate next review time
			// For now, just emit event

			// Emit event
			this.eventBus.emit(AppEvents.CARD_RATED, {
				cardId: currentState.currentCard.id,
				rating,
			});

			// Move to next card
			await this.nextCard();
		} catch (error) {
			Logger.error('Failed to rate card:', error);
			throw error;
		}
	}

	/**
	 * Navigates to the next card in the queue
	 * Ends session if no more cards are available
	 */
	async nextCard(): Promise<void> {
		const currentState = this.state;

		if (!currentState.activeSession) {
			return;
		}

		const nextIndex = currentState.progress.currentIndex + 1;

		if (nextIndex >= currentState.queue.length) {
			// Session complete
			await this.endSession();
		} else {
			// Move to next card
			this._state.update((state) => ({
				...state,
				currentCard: state.queue[nextIndex],
				isAnswerShowing: false,
				progress: {
					...state.progress,
					currentIndex: nextIndex,
					percentage: Math.round(((nextIndex + 1) / state.progress.total) * 100),
				},
			}));
		}
	}

	/**
	 * Pauses the current session (stops timer but preserves state)
	 */
	pauseSession(): void {
		this.stopSessionTimer();
		this.eventBus.emit(AppEvents.SESSION_PAUSED, {
			sessionId: this.state.activeSession?.sessionId,
		});
		Logger.debug('Session paused');
	}

	/**
	 * Resumes a paused session
	 */
	resumeSession(): void {
		if (this.state.activeSession) {
			this.startSessionTimer();
			this.eventBus.emit(AppEvents.SESSION_RESUMED, {
				sessionId: this.state.activeSession.sessionId,
			});
			Logger.debug('Session resumed');
		}
	}

	/**
	 * Ends the current review session and performs cleanup
	 */
	async endSession(): Promise<void> {
		Logger.info('Ending review session');

		// Stop session timer
		this.stopSessionTimer();

		const currentState = this.state;

		if (currentState.activeSession) {
			// Emit completion event
			this.eventBus.emit(AppEvents.SESSION_COMPLETED, {
				sessionId: currentState.activeSession.sessionId,
				cardsReviewed: currentState.progress.currentIndex + 1,
				totalCards: currentState.progress.total,
			});

			// TODO: Save session statistics to index
		}

		// Reset session state
		this._state.set(DEFAULT_STATE);
	}

	/**
	 * Shows the answer for the current card
	 */
	showAnswer(): void {
		this._state.update((state) => ({
			...state,
			isAnswerShowing: true,
		}));
	}

	/**
	 * Hides the answer for the current card
	 */
	hideAnswer(): void {
		this._state.update((state) => ({
			...state,
			isAnswerShowing: false,
		}));
	}

	/**
	 * Resets the entire store to its default state
	 */
	reset(): void {
		this.stopSessionTimer();
		this._state.set(DEFAULT_STATE);
		Logger.debug('SessionStore reset');
	}

	/**
	 * Starts the session timer
	 */
	private startSessionTimer(): void {
		this.stopSessionTimer();

		this.sessionTimer = setInterval(() => {
			// Timer for session duration tracking
			// TODO: Track session duration in state
		}, 1000);
	}

	/**
	 * Stops the session timer
	 */
	private stopSessionTimer(): void {
		if (this.sessionTimer) {
			clearInterval(this.sessionTimer);
			this.sessionTimer = undefined;
		}
	}
}
