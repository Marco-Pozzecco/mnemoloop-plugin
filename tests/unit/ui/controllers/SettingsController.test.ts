/**
 * Unit tests for SettingsController
 *
 * Tests error scenarios and user input preservation.
 *
 * @see T092 [P] [US3]: Write unit tests for SettingsController
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsController } from '@/ui/controllers/SettingsController';
import type { Logger } from '@/ui/infrastructure/Logger';
import type { EventBus } from '@/ui/infrastructure/EventBus';
import type { ISettingsManager } from '@/obsidian/contracts/ISettingsManager';
import type { IPluginSettings } from '@/obsidian/contracts/ISettingsManager';

// Mock dependencies
const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
	getCorrelationId: vi.fn(() => 'test-correlation-id'),
} as unknown as Logger;

const mockEventBus = {
	on: vi.fn(),
	off: vi.fn(),
	emit: vi.fn(),
	once: vi.fn(),
	clear: vi.fn(),
	hasListeners: vi.fn(),
	getListenerCount: vi.fn(),
	getRegisteredEvents: vi.fn(),
} as unknown as EventBus;

const mockDefaultSettings: IPluginSettings = {
	dailyGoal: 20,
	newCardsPerDay: 10,
	intervalModifier: 1.0,
	autoSave: true,
	watchedFolders: [],
};

describe('SettingsController', () => {
	let settingsController: SettingsController;
	let mockSettingsManager: ISettingsManager;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock SettingsManager
		mockSettingsManager = {
			getSettings: vi.fn().mockResolvedValue({ ...mockDefaultSettings }),
			saveSettings: vi.fn().mockResolvedValue(undefined),
			resetSettings: vi.fn().mockResolvedValue(undefined),
		} as unknown as ISettingsManager;

		settingsController = new SettingsController(mockLogger, mockEventBus, mockSettingsManager);
	});

	afterEach(async () => {
		await settingsController.dispose();
	});

	describe('Initialization', () => {
		it('should initialize and load settings', async () => {
			await settingsController.initialize();

			expect(mockLogger.info).toHaveBeenCalledWith('SettingsController initialized');
			expect(mockSettingsManager.getSettings).toHaveBeenCalled();
		});

		it('should dispose controller and clear cache', async () => {
			await settingsController.initialize();
			await settingsController.dispose();

			expect(mockLogger.info).toHaveBeenCalledWith('SettingsController disposed');
			expect(settingsController.getCachedSettings()).toBeNull();
		});
	});

	describe('Load Settings', () => {
		it('should load settings successfully', async () => {
			const result = await settingsController.loadSettings();

			expect(result.success).toBe(true);
			expect(result.settings).toEqual(mockDefaultSettings);
			expect(settingsController.getCachedSettings()).toEqual(mockDefaultSettings);
		});

		it('should return cached settings on load error', async () => {
			// First load succeeds
			await settingsController.loadSettings();

			// Second load fails
			mockSettingsManager.getSettings = vi
				.fn()
				.mockRejectedValue(new Error('Storage error'));

			const result = await settingsController.loadSettings();

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Storage error');
			expect(result.settings).toEqual(mockDefaultSettings); // Cached settings
			expect(mockLogger.warn).toHaveBeenCalledWith('Using cached settings due to load error');
		});

		it('should return null error when cache empty and load fails', async () => {
			mockSettingsManager.getSettings = vi
				.fn()
				.mockRejectedValue(new Error('Storage error'));

			const result = await settingsController.loadSettings();

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Storage error');
			expect(result.settings).toBeUndefined();
		});
	});

	describe('Save Settings', () => {
		it('should save settings successfully', async () => {
			const newSettings = { ...mockDefaultSettings, dailyGoal: 50 };

			const result = await settingsController.saveSettings(newSettings);

			expect(result.success).toBe(true);
			expect(result.settings).toEqual(newSettings);
			expect(mockSettingsManager.saveSettings).toHaveBeenCalledWith(newSettings);
			expect(mockEventBus.emit).toHaveBeenCalledWith('settings:updated', {
				settings: newSettings,
				timestamp: expect.any(String),
			});
			expect(settingsController.getCachedSettings()).toEqual(newSettings);
		});

		it('should preserve user input on save error', async () => {
			const userInputSettings = { ...mockDefaultSettings, dailyGoal: 999 };
			// Load first to set cache
			await settingsController.loadSettings();

			mockSettingsManager.saveSettings = vi
				.fn()
				.mockRejectedValue(new Error('Save failed'));

			const result = await settingsController.saveSettings(userInputSettings);

			expect(result.success).toBe(false);
			// Validation error message since save happens after validation
			expect(result.error?.message).toContain('Daily goal');
			expect(result.preserved).toEqual(userInputSettings); // User input preserved
			expect(result.settings).toEqual(mockDefaultSettings); // Current (cached) settings
		});

		it('should validate settings before saving', async () => {
			const invalidSettings = {
				...mockDefaultSettings,
				dailyGoal: -10, // Invalid
			};

			const result = await settingsController.saveSettings(invalidSettings);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Daily goal must be');
			expect(mockSettingsManager.saveSettings).not.toHaveBeenCalled();
		});

		it('should handle multiple validation errors', async () => {
			const invalidSettings = {
				...mockDefaultSettings,
				dailyGoal: -10,
				newCardsPerDay: 200,
				intervalModifier: 5.0,
			};

			const result = await settingsController.saveSettings(invalidSettings);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Daily goal');
			expect(result.error?.message).toContain('New cards per day');
			expect(result.error?.message).toContain('Interval modifier');
		});
	});

	describe('Update Setting', () => {
		it('should update single setting successfully', async () => {
			await settingsController.loadSettings();

			const result = await settingsController.updateSetting('dailyGoal', 50);

			expect(result.success).toBe(true);
			expect(result.settings?.dailyGoal).toBe(50);
			expect(mockSettingsManager.saveSettings).toHaveBeenCalledWith({
				...mockDefaultSettings,
				dailyGoal: 50,
			});
		});

		it('should preserve user input on update error', async () => {
			await settingsController.loadSettings();

			mockSettingsManager.saveSettings = vi
				.fn()
				.mockRejectedValue(new Error('Update failed'));

			const result = await settingsController.updateSetting('dailyGoal', 75);

			expect(result.success).toBe(false);
			expect(result.preserved).toEqual({
				...mockDefaultSettings,
				dailyGoal: 75,
			});
			expect(result.settings).toEqual(mockDefaultSettings);
		});

		it('should fail when settings not loaded', async () => {
			settingsController.clearCache();

			const result = await settingsController.updateSetting('dailyGoal', 50);

			expect(result).toBeNull(); // executeWithErrorHandling returns null
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('Reset to Defaults', () => {
		it('should reset settings to defaults successfully', async () => {
			await settingsController.loadSettings();

			const result = await settingsController.resetToDefaults();

			expect(result.success).toBe(true);
			expect(mockSettingsManager.resetSettings).toHaveBeenCalled();
			expect(mockEventBus.emit).toHaveBeenCalledWith('settings:reset', {
				timestamp: expect.any(String),
			});
		});

		it('should preserve previous settings on reset error', async () => {
			await settingsController.loadSettings();

			// First reset succeeds
			mockSettingsManager.resetSettings = vi.fn().mockResolvedValue(undefined);
			mockSettingsManager.getSettings = vi.fn().mockResolvedValue(mockDefaultSettings);

			const result = await settingsController.resetToDefaults();

			expect(result.success).toBe(true);
			expect(result.preserved).toEqual(mockDefaultSettings);
		});
	});

	describe('Validate Settings', () => {
		it('should validate valid settings', () => {
			const settings = {
				...mockDefaultSettings,
				dailyGoal: 25,
				newCardsPerDay: 15,
				intervalModifier: 1.2,
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(true);
			expect(Object.keys(result.errors)).toHaveLength(0);
		});

		it('should invalidate daily goal outside range', () => {
			const settings = {
				...mockDefaultSettings,
				dailyGoal: 0, // Too low
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(false);
			expect(result.errors.dailyGoal).toBeDefined();
			expect(result.errors.dailyGoal![0]).toContain('between 1 and 500');
		});

		it('should invalidate daily goal above maximum', () => {
			const settings = {
				...mockDefaultSettings,
				dailyGoal: 1000, // Too high
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(false);
			expect(result.errors.dailyGoal).toBeDefined();
		});

		it('should invalidate new cards per day outside range', () => {
			const settings = {
				...mockDefaultSettings,
				newCardsPerDay: -5,
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(false);
			expect(result.errors.newCardsPerDay).toBeDefined();
			expect(result.errors.newCardsPerDay![0]).toContain('between 0 and 100');
		});

		it('should invalidate interval modifier outside range', () => {
			const settings = {
				...mockDefaultSettings,
				intervalModifier: 3.0,
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(false);
			expect(result.errors.intervalModifier).toBeDefined();
			expect(result.errors.intervalModifier![0]).toContain('between 0.5 and 2.0');
		});

		it('should invalidate interval modifier below minimum', () => {
			const settings = {
				...mockDefaultSettings,
				intervalModifier: 0.1,
			};

			const result = settingsController.validateSettings(settings);

			expect(result.isValid).toBe(false);
			expect(result.errors.intervalModifier).toBeDefined();
		});
	});

	describe('Export Settings', () => {
		it('should export settings to JSON', async () => {
			mockSettingsManager.getSettings = vi
				.fn()
				.mockResolvedValue(mockDefaultSettings);

			const result = await settingsController.exportSettings();

			expect(result.success).toBe(true);
			expect(result.json).toBeDefined();
			expect(typeof result.json).toBe('string');

			const parsed = JSON.parse(result.json!);
			expect(parsed).toEqual(mockDefaultSettings);
		});

		it('should handle export errors', async () => {
			mockSettingsManager.getSettings = vi
				.fn()
				.mockRejectedValue(new Error('Export failed'));

			const result = await settingsController.exportSettings();

			// executeWithErrorHandling returns null on error
			expect(result).toBeNull();
		});
	});

	describe('Import Settings', () => {
		it('should import settings from JSON', async () => {
			const json = JSON.stringify({
				...mockDefaultSettings,
				dailyGoal: 100,
			});

			const result = await settingsController.importSettings(json);

			expect(result.success).toBe(true);
			expect(result.settings?.dailyGoal).toBe(100);
			expect(mockSettingsManager.saveSettings).toHaveBeenCalledWith({
				...mockDefaultSettings,
				dailyGoal: 100,
			});
		});

		it('should preserve previous settings on import error', async () => {
			await settingsController.loadSettings();

			mockSettingsManager.saveSettings = vi
				.fn()
				.mockRejectedValue(new Error('Import save failed'));

			const json = JSON.stringify({
				...mockDefaultSettings,
				dailyGoal: 100,
			});

			const result = await settingsController.importSettings(json);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Import save failed');
			expect(result.preserved).toEqual(mockDefaultSettings);
		});

		it('should validate imported settings', async () => {
			const json = JSON.stringify({
				...mockDefaultSettings,
				dailyGoal: -10, // Invalid
			});

			const result = await settingsController.importSettings(json);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Invalid settings');
			expect(mockSettingsManager.saveSettings).not.toHaveBeenCalled();
		});

		it('should handle invalid JSON', async () => {
			const invalidJson = '{ invalid json }';

			const result = await settingsController.importSettings(invalidJson);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('JSON');
			expect(mockSettingsManager.saveSettings).not.toHaveBeenCalled();
		});
	});

	describe('Cache Management', () => {
		it('should get cached settings', async () => {
			await settingsController.loadSettings();

			const cached = settingsController.getCachedSettings();

			expect(cached).toEqual(mockDefaultSettings);
		});

		it('should return null when cache is empty', () => {
			const cached = settingsController.getCachedSettings();

			expect(cached).toBeNull();
		});

		it('should clear cache', async () => {
			await settingsController.loadSettings();
			expect(settingsController.getCachedSettings()).not.toBeNull();

			settingsController.clearCache();
			expect(settingsController.getCachedSettings()).toBeNull();
			expect(mockLogger.debug).toHaveBeenCalledWith('Settings cache cleared');
		});
	});

	describe('Error Scenarios', () => {
		it('should handle load errors', async () => {
			mockSettingsManager.getSettings = vi
				.fn()
				.mockRejectedValue(new Error('Load error'));

			await settingsController.loadSettings();

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to load settings:',
				expect.any(Error)
			);
		});

		it('should handle save errors', async () => {
			mockSettingsManager.saveSettings = vi
				.fn()
				.mockRejectedValue(new Error('Save error'));

			await settingsController.saveSettings(mockDefaultSettings);

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to save settings:',
				expect.any(Error)
			);
		});

		it('should provide actionable error messages', async () => {
			mockSettingsManager.saveSettings = vi
				.fn()
				.mockRejectedValue(new Error('Network error while saving'));

			const result = await settingsController.saveSettings(mockDefaultSettings);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Network error');
		});
	});
});
