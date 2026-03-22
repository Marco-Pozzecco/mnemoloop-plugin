import { Writable, writable } from "svelte/store"
import { BaseStoreManager } from "./base.store";
import { IReviewQueue } from "@/interfaces/IReviewQueue";

export interface SessionState<T = unknown> {
  queue: IReviewQueue<T> | null;
  isAnswerShowing: boolean;
};

export const DefaultSessionState: SessionState = {
  queue: null,
  isAnswerShowing: false,
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

  reset(): void {
    this.store.set(DefaultSessionState as SessionState<T>);
  }
}

export const sessionStore = new SessionStore();
