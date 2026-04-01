import { Writable, writable } from "svelte/store"
import { v4 as uuid } from "uuid";
import { BaseStoreManager } from "./base.store";
import { IReviewQueue } from "@/interfaces/IReviewQueue";

export interface SessionState<T = unknown> {
  queue: IReviewQueue<T> | null;
  isAnswerShowing: boolean;
  session_id: string | null;
  review_type: string;
  start_time: number | null;
  total_count: number;
  correct_count: number;
  incorrect_count: number;
};

export const DefaultSessionState: SessionState = {
  queue: null,
  isAnswerShowing: false,
  session_id: null,
  review_type: "",
  start_time: null,
  total_count: 0,
  correct_count: 0,
  incorrect_count: 0,
};

const store = writable(DefaultSessionState);

export class SessionStore<T = unknown> extends BaseStoreManager<SessionState<T>> {
  constructor() {
    super(DefaultSessionState as SessionState<T>, store as Writable<SessionState<T>>)
  }

  set queue(list: IReviewQueue<T>) {
    this.state.queue = list;
  }

  get queue(): IReviewQueue<T> | null {
    return this.state.queue;
  }

  get isAnswerShowing(): boolean {
    return this.state.isAnswerShowing;
  }

  showAnswer(): void {
    this.store.update((state) => ({ ...state, isAnswerShowing: true }));
  }

  hideAnswer(): void {
    this.store.update((state) => ({ ...state, isAnswerShowing: false }));
  }

  startSession(reviewType: string): void {
    this.store.update((state) => ({
      ...state,
      session_id: uuid(),
      review_type: reviewType,
      start_time: Date.now(),
      total_count: 0,
      correct_count: 0,
      incorrect_count: 0,
    }));
  }

  recordReview(successful: boolean): void {
    this.store.update((state) => ({
      ...state,
      total_count: state.total_count + 1,
      correct_count: state.correct_count + (successful ? 1 : 0),
      incorrect_count: state.incorrect_count + (successful ? 0 : 1),
    }));
  }

  reset(): void {
    this.store.set(DefaultSessionState as SessionState<T>);
  }
}

export const sessionStore = new SessionStore();
