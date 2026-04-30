import { Unsubscriber, Writable } from "svelte/store";

export class BaseStoreManager<T> {
  store: Writable<T>;
  state: T;
  unsubscriber: Unsubscriber;

  constructor(initialState: T, store: Writable<T>) {
    this.state = initialState;
    this.store = store;
    this.unsubscriber = store.subscribe(state => { this.state = state })
  }
}
