import { writable, derived, type Writable, get } from 'svelte/store';
import type { IPluginSettings } from '@/obsidian/contracts/ISettingsManager';
import type { SettingsManager } from '@/obsidian/SettingsManager';

export interface SettingsStoreState {
	settings: IPluginSettings;
	isLoading: boolean;
	hasChanges: boolean;
	validationErrors: Record<string, string>;
}

interface SettingsStoreOptions {
	settingsManager: SettingsManager;
}

const DEFAULT_STATE: SettingsStoreState = {
	settings: {
		flashcardsDirectory: '/flashcards/',
		watchDirectories: ['/'],
		watchTags: [],
		ignoredDirectories: ['.obsidian'],
		debounceTimeoutMs: 1000,
		enableSoftDelete: true,
		softDeleteHours: 24,
		// commandShortcuts: {},
	},
	isLoading: false,
	hasChanges: false,
	validationErrors: {},
};

export class SettingsStore {
	private _state: Writable<SettingsStoreState>;
	private settingsManager: SettingsManager;
	private initialSettings: IPluginSettings;

	constructor(options: SettingsStoreOptions) {
		this.settingsManager = options.settingsManager;
		this.initialSettings = { ...options.settingsManager.getSettings() };
		this._state = writable({
			...DEFAULT_STATE,
			settings: { ...this.initialSettings },
		});
	}

	subscribe(run: (value: SettingsStoreState) => void) {
		return this._state.subscribe(run);
	}

	get settings() {
		return derived(this._state, ($s) => $s.settings);
	}

	get isLoading() {
		return derived(this._state, ($s) => $s.isLoading);
	}

	get hasChanges() {
		return derived(this._state, ($s) => $s.hasChanges);
	}

	get validationErrors() {
		return derived(this._state, ($s) => $s.validationErrors);
	}

	async updateSettings(updates: Partial<IPluginSettings>): Promise<void> {
		this._state.update((state) => ({
			...state,
			isLoading: true,
		}));

		try {
			const currentSettings = get(this._state).settings;
			const newSettings = {
				...currentSettings,
				...updates,
			};

			const validatedSettings = this.settingsManager.validateSettings(newSettings);
			await this.settingsManager.updateSettings(updates);

			this._state.update((state) => ({
				...state,
				settings: validatedSettings,
				hasChanges: false,
				validationErrors: {},
				isLoading: false,
			}));

			this.initialSettings = { ...validatedSettings };
		} catch (error) {
			this._state.update((state) => ({
				...state,
				isLoading: false,
			}));
			throw error;
		}
	}

	setPendingChanges(updates: Partial<IPluginSettings>): void {
		this._state.update((state) => {
			const newSettings = {
				...state.settings,
				...updates,
			};

			const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(this.initialSettings);

			return {
				...state,
				settings: newSettings,
				hasChanges,
			};
		});
	}

	async resetToDefaults(): Promise<void> {
		this._state.update((state) => ({
			...state,
			isLoading: true,
		}));

		try {
			await this.settingsManager.resetToDefaults();
			const defaultSettings = this.settingsManager.getSettings();

			this._state.update((state) => ({
				...state,
				settings: { ...defaultSettings },
				hasChanges: false,
				validationErrors: {},
				isLoading: false,
			}));

			this.initialSettings = { ...defaultSettings };
		} catch (error) {
			this._state.update((state) => ({
				...state,
				isLoading: false,
			}));
			throw error;
		}
	}

	discardChanges(): void {
		this._state.update((state) => ({
			...state,
			settings: { ...this.initialSettings },
			hasChanges: false,
			validationErrors: {},
		}));
	}

	validateSetting(key: keyof IPluginSettings, value: unknown): boolean {
		try {
			const currentSettings = get(this._state).settings;
			const testSettings = {
				...currentSettings,
				[key]: value,
			};
			this.settingsManager.validateSettings(testSettings);

			this._state.update((state) => ({
				...state,
				validationErrors: {
					...state.validationErrors,
					[key]: '',
				},
			}));
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Invalid value';
			this._state.update((state) => ({
				...state,
				validationErrors: {
					...state.validationErrors,
					[key]: errorMessage,
				},
			}));
			return false;
		}
	}

	refresh(): void {
		this.initialSettings = { ...this.settingsManager.getSettings() };
		this._state.update((state) => ({
			...state,
			settings: { ...this.initialSettings },
			hasChanges: false,
			validationErrors: {},
		}));
	}
}
