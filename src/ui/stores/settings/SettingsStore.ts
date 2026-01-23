import { writable, type Writable } from 'svelte/store';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/utils/Logger';
import type { SettingsState } from './types';

/**
 * Default settings
 */
const DEFAULT_SETTINGS: SettingsState = {
	theme: 'system',
	dailyGoal: 20,
	reviewOptions: {
		maxCardsPerSession: 50,
		showAnswerTimer: 3,
		autoAdvance: true,
		showStatsAfterSession: true,
	},
	interface: {
		showShortcuts: true,
		showProgressBar: true,
	},
};

/**
 * Dependencies required by SettingsStore
 */
export interface SettingsStoreDependencies {
	eventBus: EventBus;
	// Optional: Add persistence adapter here
}

/**
 * Settings Store for managing application settings.
 *
 * Handles:
 * - Theme preferences
 * - Review session options
 * - UI interface settings
 * - Settings persistence (to be implemented)
 * - EventBus integration for cross-component communication
 */
export class SettingsStore {
	private readonly _settings: Writable<SettingsState>;
	private readonly eventBus: EventBus;

	constructor(dependencies: SettingsStoreDependencies) {
		this._settings = writable(DEFAULT_SETTINGS);
		this.eventBus = dependencies.eventBus;

		Logger.debug('SettingsStore initialized');
	}

	/**
	 * Subscribe to settings changes
	 */
	subscribe(run: (value: SettingsState) => void) {
		return this._settings.subscribe(run);
	}

	/**
	 * Gets the current settings snapshot
	 */
	get settings(): SettingsState {
		let currentSettings: SettingsState | null = null;
		this._settings.subscribe((settings) => {
			currentSettings = settings;
		})();
		return currentSettings!;
	}

	/**
	 * Updates a specific setting
	 *
	 * @param key - Path to the setting (e.g., 'theme', 'reviewOptions.maxCardsPerSession')
	 * @param value - New value for the setting
	 */
	updateSetting(key: string, value: unknown): void {
		Logger.debug(`Updating setting: ${key} = ${JSON.stringify(value)}`);

		this._settings.update((settings) => {
			// Handle nested keys with dot notation
			const keys = key.split('.');
			const newSettings = { ...settings };

			if (keys.length === 1) {
				// Top-level setting
				(newSettings as any)[keys[0]] = value;
			} else if (keys.length === 2) {
				// Nested setting - deep copy to avoid mutation
				if (!newSettings[keys[0] as keyof SettingsState]) {
					(newSettings as any)[keys[0]] = {};
				}
				(newSettings as any)[keys[0]] = {
					...(newSettings as any)[keys[0]],
					[keys[1]]: value,
				};
			}

			return newSettings;
		});

		// Emit event
		this.eventBus.emit(AppEvents.SETTINGS_UPDATED, { key, value });

		// If theme changed, emit theme-specific event
		if (key === 'theme') {
			this.eventBus.emit(AppEvents.THEME_CHANGED, { theme: value });
		}

		// TODO: Persist settings to plugin data
	}

	/**
	 * Gets a specific setting value
	 *
	 * @param key - Path to the setting (e.g., 'theme', 'reviewOptions.maxCardsPerSession')
	 * @returns The setting value or undefined if not found
	 */
	getSetting(key: string): unknown {
		const settings = this.settings;
		const keys = key.split('.');

		if (keys.length === 1) {
			return (settings as any)[keys[0]];
		} else if (keys.length === 2) {
			return (settings as any)[keys[0]]?.[keys[1]];
		}

		return undefined;
	}

	/**
	 * Resets all settings to defaults
	 */
	resetToDefaults(): void {
		Logger.info('Resetting settings to defaults');
		this._settings.set(DEFAULT_SETTINGS);

		// Emit event
		this.eventBus.emit(AppEvents.SETTINGS_RESET, {});
	}

	/**
	 * Resets the entire store to its default state
	 */
	reset(): void {
		this.resetToDefaults();
		Logger.debug('SettingsStore reset');
	}
}
