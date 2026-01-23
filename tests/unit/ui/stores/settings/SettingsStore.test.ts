import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsStore } from '@/ui/stores/settings/SettingsStore';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import type { SettingsState } from '@/ui/stores/settings/types';

const mockDependencies = {
	eventBus: new EventBus(),
};

describe('SettingsStore', () => {
	let settingsStore: SettingsStore;

	beforeEach(() => {
		settingsStore = new SettingsStore(mockDependencies);
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('should initialize with default settings', () => {
			const settings = settingsStore.settings;

			expect(settings.theme).toBe('system');
			expect(settings.dailyGoal).toBe(20);
			expect(settings.reviewOptions.maxCardsPerSession).toBe(50);
			expect(settings.reviewOptions.showAnswerTimer).toBe(3);
			expect(settings.reviewOptions.autoAdvance).toBe(true);
			expect(settings.reviewOptions.showStatsAfterSession).toBe(true);
			expect(settings.interface.showShortcuts).toBe(true);
			expect(settings.interface.showProgressBar).toBe(true);
		});

		it('should provide subscribe method', () => {
			expect(typeof settingsStore.subscribe).toBe('function');
		});
	});

	describe('updateSetting', () => {
		it('should update top-level setting', () => {
			const emitSpy = vi.spyOn(settingsStore['eventBus'], 'emit');

			settingsStore.updateSetting('dailyGoal', 30);

			expect(settingsStore.settings.dailyGoal).toBe(30);
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SETTINGS_UPDATED, {
				key: 'dailyGoal',
				value: 30,
			});
		});

		it('should update nested setting with dot notation', () => {
			const emitSpy = vi.spyOn(settingsStore['eventBus'], 'emit');

			settingsStore.updateSetting('reviewOptions.maxCardsPerSession', 100);

			expect(settingsStore.settings.reviewOptions.maxCardsPerSession).toBe(100);
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SETTINGS_UPDATED, {
				key: 'reviewOptions.maxCardsPerSession',
				value: 100,
			});
		});

		it('should emit theme-specific event when updating theme', () => {
			const emitSpy = vi.spyOn(settingsStore['eventBus'], 'emit');

			settingsStore.updateSetting('theme', 'dark');

			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SETTINGS_UPDATED, {
				key: 'theme',
				value: 'dark',
			});
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.THEME_CHANGED, {
				theme: 'dark',
			});
		});

		it('should handle boolean values', () => {
			settingsStore.updateSetting('reviewOptions.autoAdvance', false);

			expect(settingsStore.settings.reviewOptions.autoAdvance).toBe(false);
		});
	});

	describe('getSetting', () => {
		it('should get top-level setting', () => {
			settingsStore.updateSetting('dailyGoal', 50);

			const value = settingsStore.getSetting('dailyGoal');

			expect(value).toBe(50);
		});

		it('should get nested setting with dot notation', () => {
			settingsStore.updateSetting('reviewOptions.maxCardsPerSession', 75);

			const value = settingsStore.getSetting('reviewOptions.maxCardsPerSession');

			expect(value).toBe(75);
		});

		it('should return undefined for non-existent setting', () => {
			const value = settingsStore.getSetting('nonExistent');

			expect(value).toBeUndefined();
		});
	});

	describe('resetToDefaults', () => {
		it('should reset all settings to defaults', () => {
			// Modify settings
			settingsStore.updateSetting('theme', 'light');
			settingsStore.updateSetting('dailyGoal', 100);
			settingsStore.updateSetting('reviewOptions.maxCardsPerSession', 200);

			const emitSpy = vi.spyOn(settingsStore['eventBus'], 'emit');

			// Reset
			settingsStore.resetToDefaults();

			// Verify reset to defaults
			expect(settingsStore.settings.theme).toBe('system');
			expect(settingsStore.settings.dailyGoal).toBe(20);
			expect(settingsStore.settings.reviewOptions.maxCardsPerSession).toBe(50);

			// Verify event emitted
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.SETTINGS_RESET, {});
		});
	});

	describe('reset', () => {
		it('should reset store to default state', () => {
			// Modify settings
			settingsStore.updateSetting('theme', 'light');
			settingsStore.updateSetting('dailyGoal', 100);

			// Reset
			settingsStore.reset();

			// Verify reset to defaults
			expect(settingsStore.settings.theme).toBe('system');
			expect(settingsStore.settings.dailyGoal).toBe(20);
		});
	});

	describe('settings state immutability', () => {
		it('should not modify original state when accessing', () => {
			const settings1 = settingsStore.settings;
			const settings2 = settingsStore.settings;

			// They should have same values but be different references
			expect(settings1).toEqual(settings2);
		});
	});
});
