import { AppViews } from "@/ui/views/App/types";
import { writable } from "svelte/store";
import { BaseStoreManager } from "./base";

interface UIState {
  currentView: AppViews,
  isLoading: boolean,
}

const initialUIState: UIState = {
  currentView: 'dashboard',
  isLoading: false,
};

export const UIStore = writable(initialUIState);

class UIStoreManager extends BaseStoreManager<UIState> {
  constructor() {
    super(initialUIState, UIStore);
  }

  setView(view: AppViews) {
    this.store.update((state) => ({ ...state, currentView: view }))
  }

  setLoading(loading: boolean) {
    this.store.update((state) => ({ ...state, isLoading: loading }))
  }

}

export type IUIStoreManager = typeof UIStoreManager;
export const uiStoreManager = new UIStoreManager();
