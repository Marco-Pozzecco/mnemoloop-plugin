import { IReviewItem } from '@/interfaces/IReviewItem';
import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { EventBus, FlashcardReviewSessionEndEvent } from '@/modules/events';
import { Rating } from 'ts-fsrs';
import { sessionStore } from '../store/session.store';
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
			return total - this._queue.position;
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

		item.review(rating);
		this._sessionStore.recordReview(rating >= 3);
	};

	endReview: () => void = () => {
		const state = this._sessionStore.state;
		if (state.session_id && state.start_time) {
			this._queue.recalc();
			const end_time = Date.now();

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
