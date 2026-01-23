import { writable, type Writable } from 'svelte/store';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/utils/Logger';
import type { UIState, AppViewType, ModalState } from './types';

/**
 * Default UI state
 */
const DEFAULT_UI_STATE: UIState = {
	currentView: 'dashboard',
	theme: 'dark',
	modal: {
		isOpen: false,
		type: null,
		data: null,
	},
	isLoading: false,
	error: {
		hasError: false,
		message: null,
	},
};

/**
 * Dependencies required by UIStore
 */
export interface UIStoreDependencies {
	eventBus: EventBus;
}

/**
 * UI Store for managing application UI state.
 *
 * Handles:
 * - View navigation (dashboard, review, settings)
 * - Theme state
 * - Modal management
 * - Loading and error states
 * - EventBus integration for cross-component communication
 */
export class UIStore {
	private readonly _ui: Writable<UIState>;
	private readonly eventBus: EventBus;

	constructor(dependencies: UIStoreDependencies) {
		this._ui = writable(DEFAULT_UI_STATE);
		this.eventBus = dependencies.eventBus;

		Logger.debug('UIStore initialized');
	}

	/**
	 * Subscribe to UI state changes
	 */
	subscribe(run: (value: UIState) => void) {
		return this._ui.subscribe(run);
	}

	/**
	 * Gets the current UI state snapshot
	 */
	get state(): UIState {
		let currentState: UIState | null = null;
		this._ui.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}

	/**
	 * Navigates to the specified view
	 *
	 * @param view - Target view to navigate to
	 */
	navigate(view: AppViewType): void {
		Logger.debug(`Navigating to view: ${view}`);

		this._ui.update((state) => ({
			...state,
			currentView: view,
		}));

		// Emit event
		this.eventBus.emit(AppEvents.VIEW_CHANGED, { view });
	}

	/**
	 * Opens a modal
	 *
	 * @param type - Type of modal to open
	 * @param data - Optional data to pass to the modal
	 */
	openModal(type: string, data?: unknown): void {
		Logger.debug(`Opening modal: ${type}`);

		this._ui.update((state) => ({
			...state,
			modal: {
				isOpen: true,
				type,
				data: data ?? null,
			},
		}));
	}

	/**
	 * Closes the current modal
	 */
	closeModal(): void {
		Logger.debug('Closing modal');

		this._ui.update((state) => ({
			...state,
			modal: {
				isOpen: false,
				type: null,
				data: null,
			},
		}));
	}

	/**
	 * Sets the theme
	 *
	 * @param theme - Theme to set ('light' or 'dark')
	 */
	setTheme(theme: 'light' | 'dark'): void {
		Logger.debug(`Setting theme: ${theme}`);

		this._ui.update((state) => ({
			...state,
			theme,
		}));

		// Emit event
		this.eventBus.emit(AppEvents.THEME_CHANGED, { theme });
	}

	/**
	 * Sets the loading state
	 *
	 * @param isLoading - Whether the app is loading
	 */
	setLoading(isLoading: boolean): void {
		this._ui.update((state) => ({
			...state,
			isLoading,
		}));
	}

	/**
	 * Sets an error state
	 *
	 * @param message - Error message to display
	 */
	setError(message: string): void {
		Logger.error(`UI error: ${message}`);

		this._ui.update((state) => ({
			...state,
			error: {
				hasError: true,
				message,
			},
		}));
	}

	/**
	 * Clears the error state
	 */
	clearError(): void {
		this._ui.update((state) => ({
			...state,
			error: {
				hasError: false,
				message: null,
			},
		}));
	}

	/**
	 * Resets the entire store to its default state
	 */
	reset(): void {
		this._ui.set(DEFAULT_UI_STATE);
		Logger.debug('UIStore reset');
	}
}
