import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { DEFAULT_PLUGIN_SETTINGS, PluginSettingsSchema } from '@/schemas/settings';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

describe('SettingsAdapter', () => {
	let plugin: unknown;
	let adapter: SettingsAdapter;

	beforeEach(() => {
		plugin = createMockPlugin([]);
		adapter = new SettingsAdapter(plugin as Plugin);
	});

	describe('constructor', () => {
		it('should initialize with default settings', () => {
			expect(adapter.data).toEqual(DEFAULT_PLUGIN_SETTINGS);
			expect(adapter.data.flashcard.fsrs).toEqual(DEFAULT_PLUGIN_SETTINGS.flashcard.fsrs);
		});
	});

	describe('loadData', () => {
		it('should delegate to plugin.loadData', async () => {
			const p = plugin as Record<string, unknown>;
			p.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(p.loadData).toHaveBeenCalled();
			expect(data).toEqual(expect.objectContaining({ debounce_timeout_ms: 1000 }));
		});
	});

	describe('saveData', () => {
		it('should delegate to plugin.saveData', async () => {
			const p = plugin as Record<string, unknown>;
			const testData = { ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 };

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(testData);

			expect(p.saveData).toHaveBeenCalledWith(testData);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data from plugin', async () => {
			const p = plugin as Record<string, unknown>;
			p.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });

			await adapter.initialize();

			expect(adapter.data.debounce_timeout_ms).toBe(1000);
		});

		it('should save data via plugin.saveData', async () => {
			const p = plugin as Record<string, unknown>;
			adapter.set({ ...DEFAULT_PLUGIN_SETTINGS, debounce_timeout_ms: 1000 });

			await adapter.save();

			expect(p.saveData).toHaveBeenCalledWith(
				expect.objectContaining({ debounce_timeout_ms: 1000 }),
			);
		});
	});

	describe('source-note settings', () => {
		it('keeps source detection disabled by default', () => {
			expect(adapter.data.source_note.watch).toEqual({ directory: '', tags: [] });
		});

		it('accepts and normalizes source-note settings', async () => {
			const p = plugin as Record<string, unknown>;
			p.loadData = vi.fn().mockResolvedValue({
				...DEFAULT_PLUGIN_SETTINGS,
				source_note: {
					watch: {
						directory: ' /notes ',
						tags: [' #biology ', '#chemistry'],
					},
				},
			});

			await adapter.initialize();

			expect(adapter.data.source_note.watch).toEqual({
				directory: '/notes',
				tags: ['#biology', '#chemistry'],
			});
			expect(p.saveData).not.toHaveBeenCalled();
		});

		it('accepts explicit empty source-note criteria', async () => {
			const p = plugin as Record<string, unknown>;
			p.loadData = vi.fn().mockResolvedValue({
				...DEFAULT_PLUGIN_SETTINGS,
				source_note: { watch: { directory: '', tags: [] } },
			});

			await adapter.initialize();

			expect(adapter.data.source_note.watch).toEqual({ directory: '', tags: [] });
			expect(p.saveData).not.toHaveBeenCalled();
		});

		it('recovers invalid source-note settings from defaults', async () => {
			const p = plugin as Record<string, unknown>;
			p.loadData = vi.fn().mockResolvedValue({
				...DEFAULT_PLUGIN_SETTINGS,
				source_note: {
					watch: {
						directory: 'notes',
						tags: ['#biology'],
					},
				},
			});

			await adapter.initialize();

			expect(adapter.data.source_note.watch).toEqual({
				directory: '',
				tags: ['#biology'],
			});
			expect(p.saveData).toHaveBeenCalledTimes(1);
		});

		it('recovers missing source-note settings without discarding legacy values', async () => {
			const p = plugin as Record<string, unknown>;
			const legacySettings = {
				...DEFAULT_PLUGIN_SETTINGS,
				source_note: undefined,
				debounce_timeout_ms: 1000,
			};
			delete legacySettings.source_note;
			p.loadData = vi.fn().mockResolvedValue(legacySettings);

			await adapter.initialize();

			expect(adapter.data.debounce_timeout_ms).toBe(1000);
			expect(adapter.data.source_note.watch).toEqual({ directory: '', tags: [] });
			expect(p.saveData).toHaveBeenCalledTimes(1);
			expect(p.saveData).toHaveBeenCalledWith(
				expect.objectContaining({
					debounce_timeout_ms: 1000,
					source_note: { watch: { directory: '', tags: [] } },
				}),
			);
		});

		it('rejects invalid source directories and tags', () => {
			const result = PluginSettingsSchema.safeParse({
				...DEFAULT_PLUGIN_SETTINGS,
				source_note: {
					watch: {
						directory: 'notes',
						tags: ['biology'],
					},
				},
			});

			expect(result.success).toBe(false);
		});
	});
});
