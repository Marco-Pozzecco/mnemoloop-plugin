import { Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';
import { Rating } from 'ts-fsrs';
import { BaseStoreManager } from './base.store';
import { IReviewQueue } from '@/interfaces/IReviewQueue';

export interface ReviewAction {
	type: 'rating';
	itemId: string;
	rating: Rating;
	previousDue: string | null;
	previousStability: number | null;
	previousDifficulty: number | null;
	timestamp: number;
}

export interface SessionState<T = unknown> {
	queue: IReviewQueue<T> | null;
	is_answer_showing: boolean;
	is_answer_correct: boolean | null;
	session_id: string | null;
	review_type: string;
	deck_filter: string | null;
	start_time: number | null;
	total_count: number;
	correct_count: number;
	incorrect_count: number;
	undoStack: ReviewAction[];
	// Streak tracking
	currentStreak: number;
	maxStreak: number;
	// Pause state
	isPaused: boolean;
	pause_start_time: number | null;
	total_pause_duration_ms: number;
}

export const DefaultSessionState: SessionState = {
	queue: null,
	is_answer_showing: false,
	is_answer_correct: null,
	session_id: null,
	review_type: '',
	deck_filter: null,
	start_time: null,
	total_count: 0,
	correct_count: 0,
	incorrect_count: 0,
	undoStack: [],
	currentStreak: 0,
	maxStreak: 0,
	isPaused: false,
	pause_start_time: null,
	total_pause_duration_ms: 0,
};

const store = writable(DefaultSessionState);

export class SessionStore<T = unknown> extends BaseStoreManager<SessionState<T>> {
	constructor() {
		super(DefaultSessionState as SessionState<T>, store as Writable<SessionState<T>>);
	}

	set queue(list: IReviewQueue<T>) {
		this.state.queue = list;
	}

	get queue(): IReviewQueue<T> | null {
		return this.state.queue;
	}

	get isAnswerShowing(): boolean {
		return this.state.is_answer_showing;
	}

	get isAnswerCorrect(): boolean | null {
		return this.state.is_answer_correct;
	}

	showAnswer(): void {
		this.store.update((state) => ({
			...state,
			is_answer_showing: true,
		}));
	}

	setAnswerCorrectness(isCorrect?: boolean) {
		this.store.update((state) => ({
			...state,
			is_answer_correct: isCorrect ?? null,
		}));
	}

	hideAnswer(): void {
		this.store.update((state) => ({ ...state, is_answer_showing: false, is_answer_correct: null }));
	}

	startSession(reviewType: string, deckFilter?: string): void {
		this.store.update((state) => ({
			...state,
			session_id: uuid(),
			review_type: reviewType,
			deck_filter: deckFilter ?? null,
			start_time: Date.now(),
			total_count: 0,
			correct_count: 0,
			incorrect_count: 0,
			undoStack: [],
			currentStreak: 0,
			maxStreak: 0,
			isPaused: false,
			pause_start_time: null,
			total_pause_duration_ms: 0,
		}));
	}

	recordReview(successful: boolean): void {
		this.store.update((state) => {
			const newStreak = successful ? state.currentStreak + 1 : 0;
			const newMaxStreak = Math.max(state.maxStreak, newStreak);
			return {
				...state,
				total_count: state.total_count + 1,
				correct_count: state.correct_count + (successful ? 1 : 0),
				incorrect_count: state.incorrect_count + (successful ? 0 : 1),
				currentStreak: newStreak,
				maxStreak: newMaxStreak,
			};
		});
	}

	reset(): void {
		this.store.set(DefaultSessionState as SessionState<T>);
	}

	/**
	 * Get elapsed time since session start (accounting for pauses)
	 */
	getTimeElapsed(): number {
		const state = this.state;
		if (!state.start_time) return 0;

		const now = Date.now();
		const elapsed = now - state.start_time;
		const pauseTime =
			state.isPaused && state.pause_start_time
				? state.total_pause_duration_ms + (now - state.pause_start_time)
				: state.total_pause_duration_ms;

		return Math.max(0, elapsed - pauseTime);
	}

	/**
	 * Get effective duration (time elapsed in seconds)
	 */
	getEffectiveDuration(): number {
		return Math.floor(this.getTimeElapsed() / 1000);
	}

	/**
	 * Push an action onto the undo stack (limited to 5 most recent)
	 */
	pushUndoAction(action: ReviewAction): void {
		this.store.update((state) => {
			const newStack = [...state.undoStack, action].slice(-5);
			return { ...state, undoStack: newStack };
		});
	}

	/**
	 * Pop the most recent action from the undo stack
	 */
	popUndoAction(): ReviewAction | null {
		const currentStack = this.state.undoStack;
		if (currentStack.length === 0) return null;

		const action = currentStack[currentStack.length - 1];
		this.store.update((state) => ({
			...state,
			undoStack: state.undoStack.slice(0, -1),
		}));
		return action;
	}

	/**
	 * Peek at the most recent undo action without removing it
	 */
	peekUndoAction(): ReviewAction | null {
		const currentStack = this.state.undoStack;
		if (currentStack.length === 0) return null;
		return currentStack[currentStack.length - 1];
	}

	/**
	 * Clear the undo stack (e.g., on session pause or end)
	 */
	clearUndoStack(): void {
		this.store.update((state) => ({ ...state, undoStack: [] }));
	}

	/**
	 * Check if there are undoable actions
	 */
	canUndo(): boolean {
		return this.state.undoStack.length > 0 && !this.state.isPaused;
	}

	/**
	 * Pause the session timer
	 * Clear undo stack on session pause
	 */
	pauseSession(): void {
		this.store.update((state) => ({
			...state,
			isPaused: true,
			pause_start_time: Date.now(),
			undoStack: [], // Clear undo stack on pause
		}));
	}

	/**
	 * Resume the session timer
	 */
	resumeSession(): void {
		this.store.update((state) => {
			if (!state.isPaused || !state.pause_start_time) return state;
			const pauseDuration = Date.now() - state.pause_start_time;
			return {
				...state,
				isPaused: false,
				pause_start_time: null,
				total_pause_duration_ms: state.total_pause_duration_ms + pauseDuration,
			};
		});
	}
}

export const sessionStore = new SessionStore();
