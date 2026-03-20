import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { IReviewItem } from '@/interfaces/IReviewItem';
import { Rating } from 'ts-fsrs';
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
    return Math.round(((this.position + 1) / total) * 100); // 0-100
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
  };

  endReview: () => void = () => {
    this._uiStore.currentView = "dashboard";
  };
}
