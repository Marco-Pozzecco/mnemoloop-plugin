/**
 * Application view types
 */
export type AppViewType = 'dashboard' | 'review' | 'settings';

/**
 * Modal state
 */
export interface ModalState {
	/** Whether a modal is open */
	isOpen: boolean;
	/** Type of modal */
	type: string | null;
	/** Modal data/payload */
	data: unknown;
}

/**
 * Interface for UI store state
 */
export interface UIState {
	/** Current active view */
	currentView: AppViewType;
	/** Application theme (can differ from settings theme) */
	theme: 'light' | 'dark';
	/** Modal state */
	modal: ModalState;
	/** Loading state */
	isLoading: boolean;
	/** Error state */
	error: {
		hasError: boolean;
		message: string | null;
	};
}
