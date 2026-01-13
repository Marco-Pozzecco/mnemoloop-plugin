import { SettingsManager } from '@/obsidian/SettingsManager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('SettingsManager', () => {
	let settingsManager: SettingsManager;
	let mockApp: any;

	beforeEach(() => {
		mockApp = {
			vault: {
				adapter: {
					exists: vi.fn(),
					read: vi.fn(),
					write: vi.fn(),
					mkdir: vi.fn(),
				},
			},
		};

		settingsManager = new SettingsManager(mockApp);
	});

	describe('Validation', () => {
		it('should validate settings with correct schema', () => {
			const validSettings = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: ['#study'],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 1000,
				enableSoftDelete: true,
				softDeleteHours: 24,
				commandShortcuts: { 'start-review': 'Ctrl+R' },
			};

			const validated = settingsManager.validateSettings(validSettings);
			expect(validated).toEqual(validSettings);
		});

		it('should throw error for invalid flashcardsDirectory', () => {
			const invalidSettings = {
				flashcardsDirectory: 0, // should be a string
				watchDirectories: ['/'],
				watchTags: [],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 1000,
				enableSoftDelete: true,
				softDeleteHours: 24,
				commandShortcuts: {},
			};

			expect(() => settingsManager.validateSettings(invalidSettings)).toThrow();
		});

		it('should throw error for invalid watchTags (missing #)', () => {
			const invalidSettings = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: ['study'],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 1000,
				enableSoftDelete: true,
				softDeleteHours: 24,
				commandShortcuts: {},
			};

			expect(() => settingsManager.validateSettings(invalidSettings)).toThrow();
		});

		it('should throw error for debounceTimeoutMs out of range', () => {
			const invalidSettings1 = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: [],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 50,
				enableSoftDelete: true,
				softDeleteHours: 24,
				commandShortcuts: {},
			};

			const invalidSettings2 = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: [],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 6000,
				enableSoftDelete: true,
				softDeleteHours: 24,
				commandShortcuts: {},
			};

			expect(() => settingsManager.validateSettings(invalidSettings1)).toThrow();
			expect(() => settingsManager.validateSettings(invalidSettings2)).toThrow();
		});

		it('should throw error for softDeleteHours out of range', () => {
			const invalidSettings1 = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: [],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 1000,
				enableSoftDelete: true,
				softDeleteHours: 0,
				commandShortcuts: {},
			};

			const invalidSettings2 = {
				flashcardsDirectory: '/flashcards/',
				watchDirectories: ['/'],
				watchTags: [],
				ignoredDirectories: ['.obsidian'],
				debounceTimeoutMs: 1000,
				enableSoftDelete: true,
				softDeleteHours: 200,
				commandShortcuts: {},
			};

			expect(() => settingsManager.validateSettings(invalidSettings1)).toThrow();
			expect(() => settingsManager.validateSettings(invalidSettings2)).toThrow();
		});
	});

	describe('Persistence', () => {
		it('should load settings from disk on initialize', async () => {
			const mockSettings = {
				flashcardsDirectory: '/custom/',
				watchDirectories: ['/notes/'],
				watchTags: ['#review'],
				ignoredDirectories: ['.trash'],
				debounceTimeoutMs: 500,
				enableSoftDelete: false,
				softDeleteHours: 48,
				commandShortcuts: {},
			};

			mockApp.vault.adapter.exists.mockResolvedValue(true);
			mockApp.vault.adapter.read.mockResolvedValue(JSON.stringify(mockSettings));

			await settingsManager.initialize();

			const loaded = settingsManager.getSettings();
			expect(loaded.flashcardsDirectory).toBe('/custom/');
			expect(loaded.watchDirectories).toEqual(['/notes/']);
		});

		it('should create default settings if file does not exist', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			await settingsManager.initialize();

			const loaded = settingsManager.getSettings();
			expect(loaded.flashcardsDirectory).toBe('/flashcards/');
			expect(loaded.watchDirectories).toEqual(['/']);
		});

		it('should save settings to disk on update', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			await settingsManager.initialize();
			await settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' });

			expect(mockApp.vault.adapter.write).toHaveBeenCalledWith(
				'knowledge-accelerator/config.json',
				expect.stringContaining('/new/path/'),
			);
		});

		it('should merge partial settings with existing', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			await settingsManager.initialize();
			await settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' });

			const loaded = settingsManager.getSettings();
			expect(loaded.flashcardsDirectory).toBe('/new/path/');
			expect(loaded.watchDirectories).toEqual(['/']);
		});

		it('should reset to defaults', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			await settingsManager.initialize();
			await settingsManager.updateSettings({ flashcardsDirectory: '/custom/' });

			await settingsManager.resetToDefaults();

			const loaded = settingsManager.getSettings();
			expect(loaded.flashcardsDirectory).toBe('/flashcards/');
		});

		it('should handle corrupted settings file gracefully', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(true);
			mockApp.vault.adapter.read.mockResolvedValue('invalid json');

			await settingsManager.initialize();

			const loaded = settingsManager.getSettings();
			expect(loaded.flashcardsDirectory).toBe('/flashcards/');
		});

		it('should throw error on save failure', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockRejectedValue(new Error('Write failed'));

			await settingsManager.initialize();

			await expect(
				settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' }),
			).rejects.toThrow('Settings save failed');
		});
	});

	describe('Change Notifications', () => {
		it('should notify listeners when settings change', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			const listener = vi.fn();
			const unsubscribe = settingsManager.onSettingsChanged(listener);

			await settingsManager.initialize();
			await settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' });

			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					flashcardsDirectory: '/new/path/',
				}),
			);

			unsubscribe();
		});

		it('should allow unsubscribing from change notifications', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			const listener = vi.fn();
			const unsubscribe = settingsManager.onSettingsChanged(listener);

			await settingsManager.initialize();

			unsubscribe();

			await settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' });

			expect(listener).not.toHaveBeenCalled();
		});

		it('should notify multiple listeners', async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			const listener1 = vi.fn();
			const listener2 = vi.fn();

			settingsManager.onSettingsChanged(listener1);
			settingsManager.onSettingsChanged(listener2);

			await settingsManager.initialize();
			await settingsManager.updateSettings({ flashcardsDirectory: '/new/path/' });

			expect(listener1).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});
	});

	describe('Get Settings', () => {
		it('should return readonly settings', () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			settingsManager.initialize();

			const settings = settingsManager.getSettings();
			expect(settings).toBeDefined();
		});
	});

	describe('Get Schema', () => {
		it('should return Zod schema', () => {
			const schema = settingsManager.getSchema();
			expect(schema).toBeDefined();
			expect(schema.parse).toBeDefined();
		});
	});
});
