/**
 * FSRS Rating enum for flashcard review
 *
 * Values correspond to the Free Spaced Repetition Scheduler algorithm
 * - 1 (Again): Card was forgotten, review again soon
 * - 2 (Hard): Card was difficult, review in near future
 * - 3 (Good): Card was reviewed correctly, review normally
 * - 4 (Easy): Card was very easy, review in distant future
 */
export enum FSRSRating {
	Again = 1,
	Hard = 2,
	Good = 3,
	Easy = 4,
}

/**
 * Interface for session store state
 */
export interface SessionState {
	/** Current active session or null if no session is active */
	activeSession: {
		sessionId: string;
		startTime: string;
		isComplete: boolean;
	} | null;
	/** Current card being reviewed */
	currentCard: {
		id: string;
		front: string;
		back: string;
		srs: any;
	} | null;
	/** Queue of cards to review */
	queue: Array<{
		id: string;
		front: string;
		back: string;
		srs: any;
	}>;
	/** Whether the answer is currently showing */
	isAnswerShowing: boolean;
	/** Session progress */
	progress: {
		currentIndex: number;
		total: number;
		percentage: number;
	};
}
