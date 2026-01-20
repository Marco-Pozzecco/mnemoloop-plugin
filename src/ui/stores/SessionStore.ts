import { CardRating, DueQueueManager } from '@/core/srs';
import { IndexManager } from '@/core/indexer';
import { get, writable, type Writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { Flashcard } from '../../core/parser/utils/types';
import { FsrsEngine } from '../../core/srs/FsrsEngine';
import { ReviewRatingSchema } from '../schemas';
import type { ReviewSession } from '../types';
import { StatisticsManager } from '@/core/statistics';

/**
 * Interface for session store state
 */
export interface SessionState {
	/** Current active session or null if no session is active */
	activeSession: ReviewSession | null;
	/** Current card being reviewed */
	currentCard: Flashcard | null;
	/** Whether the answer is currently showing */
	isAnswerShowing: boolean;
	/** Session statistics */
	sessionStats: {
		totalReviewed: number;
		correctAnswers: number;
		incorrectAnswers: number;
		sessionDuration: number; // in seconds
	};
}

/**
 * Default initial state for session store
 */
const DEFAULT_STATE: SessionState = {
	activeSession: null,
	currentCard: null,
	isAnswerShowing: false,
	sessionStats: {
		totalReviewed: 0,
		correctAnswers: 0,
		incorrectAnswers: 0,
		sessionDuration: 0,
	},
};

/**
 * Session Store for managing flashcard review sessions.
 *
 * Handles the complete lifecycle of review sessions including:
 * - Session initialization and queue generation
 * - Card navigation and rating submission
 * - Statistics tracking and session persistence
 * - Integration with FSRS algorithm and core indexing
 */
export class SessionStore {
	private readonly _state: Writable<SessionState>;
	private readonly fsrsController: FsrsEngine;
	private readonly indexManager: IndexManager;
	private readonly statsManager: StatisticsManager;
	private sessionTimer?: NodeJS.Timeout;
	private dueQueueManager: DueQueueManager;

	constructor(
		indexManager: IndexManager,
		statsManager: StatisticsManager,
		dueQueueManager: DueQueueManager,
	) {
		this._state = writable(DEFAULT_STATE);
		this.fsrsController = new FsrsEngine();
		this.indexManager = indexManager;
		this.statsManager = statsManager;
		this.dueQueueManager = dueQueueManager;
	}

	/**
	 * Subscribe to session state changes
	 */
	subscribe(run: (value: SessionState) => void) {
		return this._state.subscribe(run);
	}

	/**
	 * Starts a new review session
	 *
	 * @param deckId - Optional deck ID to filter cards by
	 * @param limit - Optional limit on number of cards to review
	 * @returns Promise that resolves when session is initialized
	 */
	async startSession(): Promise<void> {
		try {
			// Clear any existing session
			await this.endSession();

			// Generate due queue
			const queue = this.dueQueueManager.generate();

			// Create new session
			const sessionId = uuidv4();
			const newSession: ReviewSession = {
				sessionId,
				queue: queue.cards,
				currentIndex: 0,
				startTime: new Date().toISOString(),
				isComplete: false,
				stats: {
					correct: 0,
					incorrect: 0,
					total: queue.totalDue,
				},
			};

			// Update state
			this._state.update((state) => ({
				...state,
				activeSession: newSession,
				currentCard: queue.cards[0],
				isAnswerShowing: false,
				sessionStats: {
					totalReviewed: 0,
					correctAnswers: 0,
					incorrectAnswers: 0,
					sessionDuration: 0,
				},
			}));

			// Start session timer
			this.startSessionTimer();
		} catch (error) {
			console.error('Failed to start review session:', error);
			throw error;
		}
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
	 * Submits a rating for the current card and advances to the next card
	 *
	 * @param rating - The FSRS rating (1-4: Again, Hard, Good, Easy)
	 * @returns Promise that resolves when rating is processed
	 */
	async submitRating(rating: number): Promise<void> {
		try {
			// Validate rating
			const validatedRating = ReviewRatingSchema.parse(rating);

			const { activeSession, currentCard } = get(this._state);

			if (!activeSession || !currentCard) {
				throw new Error('No active session or current card');
			}

			// Submit rating to FSRS controller
			this.fsrsController.calculate({
				current_params: currentCard.srs,
				rating: validatedRating as CardRating,
				review_time: new Date().toISOString(),
			});

			// Update session statistics
			const isCorrect = validatedRating >= 3; // Good or Easy counts as correct
			this._state.update((state) => ({
				...state,
				sessionStats: {
					...state.sessionStats,
					totalReviewed: state.sessionStats.totalReviewed + 1,
					correctAnswers: isCorrect
						? state.sessionStats.correctAnswers + 1
						: state.sessionStats.correctAnswers,
					incorrectAnswers: !isCorrect
						? state.sessionStats.incorrectAnswers + 1
						: state.sessionStats.incorrectAnswers,
				},
			}));

			// Move to next card
			await this.nextCard();
		} catch (error) {
			console.error('Failed to submit rating:', error);
			throw error;
		}
	}

	/**
	 * Navigates to the next card in the queue
	 * Ends session if no more cards are available
	 */
	async nextCard(): Promise<void> {
		const { activeSession } = get(this._state);

		if (!activeSession) return;

		const nextIndex = activeSession.currentIndex + 1;

		if (nextIndex >= activeSession.queue.length) {
			// Session complete
			await this.endSession();
		} else {
			// Move to next card
			this._state.update((state) => ({
				...state,
				activeSession: state.activeSession
					? {
							...state.activeSession,
							currentIndex: nextIndex,
						}
					: null,
				currentCard: state.activeSession?.queue[nextIndex] || null,
				isAnswerShowing: false,
			}));
		}
	}

	/**
	 * Navigates to the previous card in the queue
	 */
	previousCard(): void {
		const { activeSession } = get(this._state);

		if (!activeSession || activeSession.currentIndex <= 0) return;

		const prevIndex = activeSession.currentIndex - 1;

		this._state.update((state) => ({
			...state,
			activeSession: state.activeSession
				? {
						...state.activeSession,
						currentIndex: prevIndex,
					}
				: null,
			currentCard: state.activeSession?.queue[prevIndex] || null,
			isAnswerShowing: false,
		}));
	}

	/**
	 * Ends the current review session and performs cleanup
	 */
	async endSession(): Promise<void> {
		// Stop session timer
		this.stopSessionTimer();

		const { activeSession } = get(this._state);

		if (activeSession) {
			try {
				// Mark session as complete
				this._state.update((state) => ({
					...state,
					activeSession: state.activeSession
						? {
								...state.activeSession,
								isComplete: true,
							}
						: null,
				}));

				// Save session statistics to index (for persistence/reporting)
				await this.saveSessionStats(activeSession);
			} catch (error) {
				console.error('Failed to save session statistics:', error);
			}
		}

		// Reset session state
		this._state.update((state) => ({
			...state,
			activeSession: null,
			currentCard: null,
			isAnswerShowing: false,
		}));
	}

	/**
	 * Pauses the current session (stops timer but preserves state)
	 */
	pauseSession(): void {
		this.stopSessionTimer();
	}

	/**
	 * Resumes a paused session
	 */
	resumeSession(): void {
		if (get(this._state).activeSession) {
			this.startSessionTimer();
		}
	}

	/**
	 * Gets the current progress percentage
	 * @returns Progress as a number between 0-100
	 */
	getProgress(): number {
		const { activeSession } = get(this._state);

		if (!activeSession) return 0;

		return Math.round(((activeSession.currentIndex + 1) / activeSession.queue.length) * 100);
	}

	/**
	 * Gets the remaining card count
	 * @returns Number of cards remaining in the session
	 */
	getRemainingCount(): number {
		const { activeSession } = get(this._state);

		if (!activeSession) return 0;

		return activeSession.queue.length - activeSession.currentIndex - 1;
	}

	/**
	 * Resets the entire store to its default state
	 */
	reset(): void {
		this.stopSessionTimer();
		this._state.set(DEFAULT_STATE);
	}

	get activeSession() {
		return get(this._state).activeSession;
	}

	get currentCard() {
		return get(this._state).currentCard;
	}

	get isAnswerShowing() {
		return get(this._state).isAnswerShowing;
	}

	get sessionStats() {
		return get(this._state).sessionStats;
	}

	get sessionProgress() {
		const session = this.activeSession;
		if (!session) return 0;
		return Math.round(((session.currentIndex + 1) / session.queue.length) * 100);
	}

	get remainingCards() {
		const session = this.activeSession;
		if (!session) return 0;
		return session.queue.length - session.currentIndex - 1;
	}

	/**
	 * Starts the session timer
	 */
	private startSessionTimer(): void {
		this.stopSessionTimer();

		this.sessionTimer = setInterval(() => {
			this._state.update((state) => ({
				...state,
				sessionStats: {
					...state.sessionStats,
					sessionDuration: state.sessionStats.sessionDuration + 1,
				},
			}));
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

	/**
	 * Saves session statistics to the index for persistence
	 * @param session - The completed session to save
	 */
	private async saveSessionStats(session: ReviewSession): Promise<void> {
		// Implementation would save to a session history file or index
		// For now, we'll just log the session completion
		console.log('Session completed:', {
			sessionId: session.sessionId,
			cardsReviewed: session.stats.total,
			duration: get(this._state).sessionStats.sessionDuration,
			completedAt: new Date().toISOString(),
		});
	}
}
