/**
 * Interface for settings store state
 */
export interface SettingsState {
	/** Application theme preference */
	theme: 'light' | 'dark' | 'system';
	/** Daily review goal (number of cards) */
	dailyGoal: number;
	/** Review options */
	reviewOptions: {
		/** Maximum cards per session */
		maxCardsPerSession: number;
		/** Show answer timer (seconds) */
		showAnswerTimer: number;
		/** Auto-advance after rating */
		autoAdvance: boolean;
		/** Show statistics after session */
		showStatsAfterSession: boolean;
	};
	/** Interface preferences */
	interface: {
		/** Show keyboard shortcuts */
		showShortcuts: boolean;
		/** Show progress bar */
		showProgressBar: boolean;
	};
}
