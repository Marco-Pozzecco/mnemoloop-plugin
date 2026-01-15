import { writable, derived, type Writable } from 'svelte/store';
import type { ViewState, LoadingState, ErrorState, Notification } from '../types';

/**
 * Global UI State interface representing the entire UI's reactive state.
 */
export interface UIState {
	/** Current active view in the plugin */
	currentView: ViewState;
	/** Global loading state for async operations */
	loading: LoadingState;
	/** Global error state for error boundaries and alerts */
	error: ErrorState;
	/** Active notifications/toasts */
	notifications: Notification[];
}

/**
 * Default initial state for the UI store.
 */
const DEFAULT_STATE: UIState = {
	currentView: 'dashboard',
	loading: { isLoading: false },
	error: { hasError: false, message: '' },
	notifications: []
};

/**
 * UI Store for managing global application state.
 * Provides a centralized way to update and subscribe to UI-related state changes.
 */
class UIStore {
	private readonly _state: Writable<UIState>;

	constructor() {
		this._state = writable(DEFAULT_STATE);
	}

	/**
	 * Subscribe to state changes.
	 * Allows the store to be used directly in Svelte components with the $ prefix.
	 */
	subscribe(run: (value: UIState) => void) {
		return this._state.subscribe(run);
	}

	/**
	 * Navigates to a different view and clears any existing errors.
	 * 
	 * @param view - The target view state to navigate to
	 */
	navigate(view: ViewState) {
		this._state.update(state => ({
			...state,
			currentView: view,
			// Clear error when navigating to a new context
			error: { hasError: false, message: '' }
		}));
	}

	/**
	 * Updates the global loading state.
	 * 
	 * @param isLoading - Whether the UI is in a loading state
	 * @param message - Optional message to display during loading
	 * @param progress - Optional progress percentage (0-100)
	 */
	setLoading(isLoading: boolean, message?: string, progress?: number) {
		this._state.update(state => ({
			...state,
			loading: { isLoading, message, progress }
		}));
	}

	/**
	 * Sets the global error state and stops any active loading.
	 * 
	 * @param message - Error message to display
	 * @param code - Optional error code for troubleshooting
	 * @param retry - Optional callback function to retry the failed operation
	 */
	setError(message: string, code?: string, retry?: () => void) {
		this._state.update(state => ({
			...state,
			error: { hasError: true, message, code, retry },
			loading: { isLoading: false }
		}));
	}

	/**
	 * Clears the current error state.
	 */
	clearError() {
		this._state.update(state => ({
			...state,
			error: { hasError: false, message: '' }
		}));
	}

	/**
	 * Adds a new notification to the UI.
	 * 
	 * @param notification - Notification details (excluding ID)
	 * @returns The generated unique ID for the notification
	 */
	notify(notification: Omit<Notification, 'id'>): string {
		const id = Math.random().toString(36).substring(2, 9);
		const newNotification: Notification = { ...notification, id };

		this._state.update(state => ({
			...state,
			notifications: [...state.notifications, newNotification]
		}));

		// Auto-remove notification if duration is set (and not 0)
		if (notification.duration !== 0) {
			setTimeout(() => {
				this.removeNotification(id);
			}, notification.duration || 5000);
		}

		return id;
	}

	/**
	 * Removes a notification by its unique ID.
	 * 
	 * @param id - The ID of the notification to remove
	 */
	removeNotification(id: string) {
		this._state.update(state => ({
			...state,
			notifications: state.notifications.filter(n => n.id !== id)
		}));
	}

	/**
	 * Resets the entire store to its default initial state.
	 */
	reset() {
		this._state.set(DEFAULT_STATE);
	}
}

/**
 * Singleton instance of the UIStore.
 */
export const uiStore = new UIStore();

/**
 * Derived store for the current active view.
 */
export const currentView = derived(uiStore, $s => $s.currentView);

/**
 * Derived store for the global loading status.
 */
export const isLoading = derived(uiStore, $s => $s.loading.isLoading);

/**
 * Derived store for the current loading message.
 */
export const loadingMessage = derived(uiStore, $s => $s.loading.message);

/**
 * Derived store for the current error state.
 */
export const errorState = derived(uiStore, $s => $s.error);

/**
 * Derived store for the list of active notifications.
 */
export const notifications = derived(uiStore, $s => $s.notifications);
