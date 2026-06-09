import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
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
});
