import { z } from 'zod';

/**
 * Plugin settings structure
 */
export interface IPluginSettings {
	flashcardsDirectory: string;
	watchDirectories: string[];
	watchTags: string[];
	ignoredDirectories: string[];
	debounceTimeoutMs: number;
	enableSoftDelete: boolean;
	softDeleteHours: number;
	// commandShortcuts: Record<string, string>;
}

/**
 * Settings manager interface
 */
export interface ISettingsManager {
	/**
	 * Initialize settings manager and load from disk
	 */
	initialize(): Promise<void>;

	/**
	 * Get current settings
	 */
	getSettings(): Readonly<IPluginSettings>;

	/**
	 * Update settings and persist to disk
	 * @param partialSettings - Partial settings object to update
	 */
	updateSettings(partialSettings: Partial<IPluginSettings>): Promise<void>;

	/**
	 * Reset settings to defaults
	 */
	resetToDefaults(): Promise<void>;

	/**
	 * Validate settings object against schema
	 * @param settings - Settings to validate
	 * @returns Validated settings or throws ValidationError
	 */
	validateSettings(settings: unknown): IPluginSettings;

	/**
	 * Subscribe to settings changes
	 * @param callback - Called when settings change
	 * @returns Unsubscribe function
	 */
	onSettingsChanged(callback: (settings: Readonly<IPluginSettings>) => void): () => void;

	/**
	 * Get Zod schema for settings validation
	 */
	getSchema(): z.ZodType<IPluginSettings>;
}
