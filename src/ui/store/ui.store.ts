import { AppViews } from "@/ui/views/App/types";
import { writable } from "svelte/store";
import { BaseStoreManager } from "./base.store";

interface UIState {
  currentView: AppViews,
  isLoading: boolean,
}

const initialUIState: UIState = {
  currentView: 'dashboard',
  isLoading: false,
};

const store = writable(initialUIState);

export class UIStore extends BaseStoreManager<UIState> {
  constructor() {
    super(initialUIState, store)
  }

  get currentView() {
    return this.state.currentView;
  }

  set currentView(view: AppViews) {
    this.store.update((state) => ({ ...state, currentView: view }));
  }

  get isLoading() {
    return this.state.isLoading;
  }

  set isLoading(loading: boolean) {
    this.store.update((state) => ({ ...state, isLoading: loading }));
  }
}

export const uiStore = new UIStore();
