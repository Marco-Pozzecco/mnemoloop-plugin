import { IReviewItem } from '@/interfaces/IReviewItem';
import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { EventBus, FlashcardReviewSessionEndEvent } from '@/modules/events';
import { Rating } from 'ts-fsrs';
import { ReviewAction, sessionStore } from '../store/session.store';
import { UIStore, uiStore } from '../store/ui.store';

interface IReviewController<T> {
	readonly position: number;
	readonly current: IReviewItem<T> | null;
	readonly total: number;
	readonly remaining: number;
	readonly progress: number;

	getNextItem: () => IReviewItem<T> | null;
	getPreviousItem: () => IReviewItem<T> | null;

	scoreItem: (rating: Rating) => void;
	undoReview: () => boolean;
	canUndo: () => boolean;
	endReview: () => void;
}

export class ReviewController<T = unknown> implements IReviewController<T> {
	private _queue: IReviewQueue<T>;
	private _item: IReviewItem<T> | null;
	private _uiStore: UIStore = uiStore;
	private _sessionStore = sessionStore;

	constructor(list: IReviewQueue<T>) {
		this._queue = list;
		this._item = this._queue.current;
	}

	get position() {
		return this._queue.position;
	}

	get current() {
		return this._item;
	}

	get total(): number {
		return this._queue.size;
	}

	get remaining(): number {
		const total = this.total;
		if (total === 0) {
			return 0;
		} else {
			return total - this._sessionStore.state.total_count;
		}
	}

	get progress(): number {
		const total = this.total;
		if (total === 0) return 0;
		return Math.round((this.position / total) * 100); // 0-100
	}

	getNextItem: () => IReviewItem<T> | null = () => {
		this._item = this._queue.next();
		return this._item;
	};

	getPreviousItem: () => IReviewItem<T> | null = () => {
		this._item = this._queue.previous();
		return this._item;
	};

	scoreItem: (rating: Rating) => void = (rating) => {
		const item = this._item;

		if (!item) {
			throw new Error(`item not found at position:${this._queue.position}`);
		}

		// Get current FSRS state before reviewing (for undo)
		const flashcard = item.data as {
			id: string;
			due: string;
			stability: number;
			difficulty: number;
		} | null;
		const previousDue = flashcard?.due ?? null;
		const previousStability = flashcard?.stability ?? null;
		const previousDifficulty = flashcard?.difficulty ?? null;

		// Record the review
		item.review(rating);

		// Push to undo stack
		const undoAction: ReviewAction = {
			type: 'rating',
			itemId: item.id,
			rating,
			previousDue,
			previousStability,
			previousDifficulty,
			timestamp: Date.now(),
		};
		this._sessionStore.pushUndoAction(undoAction);

		// Record for statistics (Good=3, Easy=4 are "correct")
		this._sessionStore.recordReview(rating >= 3);
	};

	canUndo: () => boolean = () => {
		return this._sessionStore.canUndo();
	};

	undoReview: () => boolean = () => {
		const action = this._sessionStore.popUndoAction();
		if (!action) return false;

		// Find the item to restore (may not be the current one if auto-advance occurred)
		// Navigate back to the item that was rated

		// If we moved past the rated item, we need to navigate back
		// The undo action was pushed after the review, so we need to go back
		if (this._item?.id !== action.itemId) {
			// Navigate backwards until we find the item
			let found = false;
			while (this._queue.position > 0 && !found) {
				const prevItem = this._queue.previous();
				if (prevItem?.id === action.itemId) {
					found = true;
					this._item = prevItem;
				}
			}
		}

		// Restore the item's FSRS state
		if (this._item && this._item.id === action.itemId) {
			this._item.restore(action.previousDue, action.previousStability, action.previousDifficulty);
		}

		// Adjust statistics - need to "un-record" the review
		const isCorrect = action.rating >= 3;
		this._sessionStore.store.update((s) => ({
			...s,
			total_count: Math.max(0, s.total_count - 1),
			correct_count: Math.max(0, s.correct_count - (isCorrect ? 1 : 0)),
			incorrect_count: Math.max(0, s.incorrect_count - (isCorrect ? 0 : 1)),
		}));

		return true;
	};

	endReview: () => void = () => {
		const state = this._sessionStore.state;
		if (state.session_id && state.start_time) {
			const end_time = Date.now();
			this._queue.dispose();

			EventBus.instance.publish(
				new FlashcardReviewSessionEndEvent({
					session_id: state.session_id,
					date: new Date().toISOString().split('T')[0],
					review_type: state.review_type,
					start_time: state.start_time,
					end_time,
					count: state.total_count,
					correct_count: state.correct_count,
					incorrect_count: state.incorrect_count,
					duration: Math.floor((end_time - state.start_time) / 1000),
				}),
			);
		}
		this._sessionStore.reset();
		this._uiStore.currentView = 'dashboard';
	};
}
