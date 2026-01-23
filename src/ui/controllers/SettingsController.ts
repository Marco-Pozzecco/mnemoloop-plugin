/**
 * SettingsController for managing plugin settings
 *
 * Extends BaseController to provide consistent error handling and logging.
 * Handles settings load, save, update, and reset operations with
 * error recovery and user input preservation.
 *
 * @see FR-003: System MUST provide base controller class
 * @see research.md section 3: Base Controller Pattern
 */

import type { EventBus } from '@/ui/infrastructure/EventBus';
import type { Logger } from '@/utils/Logger';
import { BaseController } from '@/ui/controllers/BaseController';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import type { ISettingsManager } from '@/obsidian/contracts/ISettingsManager';
import type { IPluginSettings } from '@/obsidian/contracts/ISettingsManager';

/**
 * Interface for settings operation result
 */
export interface SettingsOperationResult {
	success: boolean;
	error?: Error;
	settings?: IPluginSettings | null;
	preserved?: IPluginSettings | null;
}

/**
 * Interface for settings with validation
 */
export interface ValidatedSettings {
	settings: IPluginSettings;
	errors: Record<string, string[]>;
	isValid: boolean;
}

/**
 * SettingsController for managing settings operations
 *
 * Provides error handling for:
 * - Loading settings from storage
 * - Saving settings to storage
 * - Updating specific setting values
 * - Resetting settings to defaults
 * - Preserving user input on error
 */
export class SettingsController extends BaseController {
	private settingsManager: ISettingsManager;
	private cachedSettings: IPluginSettings | null = null;

	constructor(logger: Logger, eventBus: EventBus, settingsManager: ISettingsManager) {
		super(logger, eventBus);
		this.settingsManager = settingsManager;
	}

	/**
	 * Initialize controller
	 */
	async initialize(): Promise<void> {
		this.logger.info('SettingsController initialized');

		// Load initial settings and cache them
		await this.loadSettings();
	}

	/**
	 * Dispose of controller
	 */
	async dispose(): Promise<void> {
		this.logger.info('SettingsController disposed');
		this.cachedSettings = null;
	}

	/**
	 * Load settings from storage
	 *
	 * Caches settings for quick access and error recovery.
	 * On error, returns last known good settings if available.
	 *
	 * @returns Settings operation result with current settings or error
	 *
	 * @example
	 * ```typescript
	 * const result = await settingsController.loadSettings();
	 * if (!result.success) {
	 *   // Use cached settings or defaults
	 *   const settings = result.settings || getDefaultSettings();
	 * }
	 * ```
	 */
	async loadSettings(): Promise<SettingsOperationResult> {
		try {
			const settings = await this.settingsManager.getSettings();
			this.cachedSettings = { ...settings };

			this.logger.debug('Settings loaded successfully');

			return { success: true, settings };
		} catch (error) {
			this.logger.error('Failed to load settings:', error);

			// Return cached settings if available
			if (this.cachedSettings) {
				this.logger.warn('Using cached settings due to load error');
				return {
					success: false,
					error: error instanceof Error ? error : new Error(String(error)),
					settings: this.cachedSettings,
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Save settings to storage
	 *
	 * Preserves user input on error by returning attempted settings
	 * alongside error. This allows the UI to show the error while
	 * keeping the user's input visible.
	 *
	 * @param settings - The settings to save
	 * @returns Settings operation result with preserved settings on error
	 *
	 * @example
	 * ```typescript
	 * const result = await settingsController.saveSettings(userSettings);
	 * if (!result.success) {
	 *   // Show error but keep user's input
	 *   showError(result.error.message, result.preserved);
	 * } else {
	 *   showSuccess('Settings saved');
	 * }
	 * ```
	 */
	async saveSettings(settings: IPluginSettings): Promise<SettingsOperationResult> {
		try {
			// Save settings
			await this.settingsManager.updateSettings(settings);

			// Update cache
			this.cachedSettings = { ...settings };

			// Emit settings updated event
			this.eventBus.emit(AppEvents.SETTINGS_UPDATED, {
				settings,
				timestamp: new Date().toISOString(),
			});

			this.logger.debug('Settings saved successfully');

			return { success: true, settings };
		} catch (error) {
			this.logger.error('Failed to save settings:', error);

			// Preserve user input on error
			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				settings: this.cachedSettings,
				preserved: settings,
			};
		}
	}

	/**
	 * Update a specific setting value
	 *
	 * Updates a single setting value and saves updated settings.
	 * Preserves all other settings and user input on error.
	 *
	 * @param key - The setting key to update
	 * @param value - The new value for setting
	 * @returns Settings operation result with preserved settings on error
	 *
	 * @example
	 * ```typescript
	 * const result = await settingsController.updateSetting('dailyGoal', 50);
	 * if (!result.success) {
	 *   // Rollback to previous value
	 *   restorePreviousSettings();
	 * }
	 * ```
	 */
	async updateSetting<K extends keyof IPluginSettings>(
		key: K,
		value: IPluginSettings[K],
	): Promise<SettingsOperationResult> {
		if (!this.cachedSettings) {
			return {
				success: false,
				error: new Error('No cached settings available. Load settings first.'),
			};
		}

		try {
			// Create updated settings object
			const updatedSettings = {
				...this.cachedSettings,
				[key]: value,
			};

			// Save updated settings
			const result = await this.saveSettings(updatedSettings);

			if (result.success) {
				this.logger.debug(`Setting ${String(key)} updated successfully`);
			}

			return result;
		} catch (error) {
			this.logger.error(`Failed to update setting ${String(key)}:`, error);

			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				settings: this.cachedSettings,
				preserved: {
					...this.cachedSettings,
					[key]: value,
				},
			};
		}
	}

	/**
	 * Reset settings to default values
	 *
	 * Loads default settings and saves them to storage.
	 * On error, preserves current settings to allow retry.
	 *
	 * @returns Settings operation result with preserved settings on error
	 *
	 * @example
	 * ```typescript
	 * const result = await settingsController.resetToDefaults();
	 * if (!result.success) {
	 *   // Show error and offer to retry
	 *   showResetError(result.error, () => resetToDefaults());
	 * }
	 * ```
	 */
	async resetToDefaults(): Promise<SettingsOperationResult> {
		try {
			// Preserve current settings in case of error
			const previousSettings = this.cachedSettings;

			// Reset to defaults
			await this.settingsManager.resetToDefaults();

			// Reload settings to update cache
			const result = await this.loadSettings();

			if (result.success) {
				// Emit settings reset event
				this.eventBus.emit(AppEvents.SETTINGS_RESET, {
					timestamp: new Date().toISOString(),
				});

				this.logger.debug('Settings reset to defaults successfully');
			}

			// Include previous settings in result for recovery
			return {
				...result,
				preserved: previousSettings,
			};
		} catch (error) {
			this.logger.error('Failed to reset settings:', error);

			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				settings: this.cachedSettings,
			};
		}
	}

	/**
	 * Validate settings values
	 *
	 * Performs validation on settings values and returns validation results.
	 *
	 * @param settings - The settings to validate
	 * @returns Validation result with errors if any
	 *
	 * @example
	 * ```typescript
	 * const validation = settingsController.validateSettings(userSettings);
	 * if (!validation.isValid) {
	 *   displayValidationErrors(validation.errors);
	 * }
	 * ```
	 */
	validateSettings(settings: IPluginSettings): ValidatedSettings {
		const errors: Record<string, string[]> = {};

		// Validate debounce timeout
		if (settings.debounceTimeoutMs !== undefined) {
			if (
				typeof settings.debounceTimeoutMs !== 'number' ||
				settings.debounceTimeoutMs < 0 ||
				settings.debounceTimeoutMs > 60000
			) {
				errors.debounceTimeoutMs = [
					'Debounce timeout must be a number between 0 and 60000 (60 seconds)',
				];
			}
		}

		// Validate soft delete hours
		if (settings.softDeleteHours !== undefined) {
			if (
				typeof settings.softDeleteHours !== 'number' ||
				settings.softDeleteHours < 0 ||
				settings.softDeleteHours > 720
			) {
				errors.softDeleteHours = ['Soft delete hours must be a number between 0 and 720 (30 days)'];
			}
		}

		// Validate flashcards directory
		if (settings.flashcardsDirectory !== undefined) {
			if (
				typeof settings.flashcardsDirectory !== 'string' ||
				settings.flashcardsDirectory.length === 0
			) {
				errors.flashcardsDirectory = ['Flashcards directory must be a non-empty string'];
			}
		}

		return {
			settings,
			errors,
			isValid: Object.keys(errors).length === 0,
		};
	}

	/**
	 * Get the cached settings
	 *
	 * @returns Cached settings or null if not loaded
	 */
	getCachedSettings(): IPluginSettings | null {
		return this.cachedSettings;
	}

	/**
	 * Clear the settings cache
	 *
	 * Forces the next load to fetch from storage.
	 */
	clearCache(): void {
		this.cachedSettings = null;
		this.logger.debug('Settings cache cleared');
	}

	/**
	 * Export settings to JSON
	 *
	 * Exports current settings to a JSON string for backup or sharing.
	 *
	 * @returns JSON string of settings or error
	 */
	async exportSettings(): Promise<{ success: boolean; json?: string; error?: Error }> {
		try {
			const settings = await this.settingsManager.getSettings();
			const json = JSON.stringify(settings, null, 2);

			this.logger.debug('Settings exported successfully');

			return { success: true, json };
		} catch (error) {
			this.logger.error('Failed to export settings:', error);
			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Import settings from JSON
	 *
	 * Imports settings from a JSON string and validates them.
	 * On error, preserves current settings.
	 *
	 * @param json - JSON string of settings to import
	 * @returns Settings operation result with preserved settings on error
	 */
	async importSettings(json: string): Promise<SettingsOperationResult> {
		try {
			// Preserve current settings
			const previousSettings = this.cachedSettings;

			// Parse JSON
			const settings = JSON.parse(json) as IPluginSettings;

			// Validate
			const validation = this.validateSettings(settings);
			if (!validation.isValid) {
				const errorMessages = Object.values(validation.errors).flat();
				throw new Error(`Invalid settings: ${errorMessages.join(', ')}`);
			}

			// Save imported settings
			const result = await this.saveSettings(settings);

			this.logger.debug('Settings imported successfully');

			return {
				...result,
				preserved: previousSettings,
			};
		} catch (error) {
			this.logger.error('Failed to import settings:', error);

			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				settings: this.cachedSettings,
				preserved: this.cachedSettings,
			};
		}
	}
}
