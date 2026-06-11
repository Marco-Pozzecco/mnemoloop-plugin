import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { DEFAULT_STATISTICS } from '@/schemas/statistics';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

function getVault(plugin: unknown): Record<string, unknown> {
	return ((plugin as Record<string, unknown>).app as Record<string, unknown>).vault as Record<string, unknown>;
}

describe('StatisticsAdapter', () => {
	let plugin: unknown;
	let adapter: StatisticsAdapter;

	beforeEach(() => {
		plugin = createMockPlugin([]);
		(plugin as Record<string, unknown>).manifest = { dir: '/test-plugin' };
		adapter = new StatisticsAdapter(plugin as Plugin);
	});

	describe('constructor', () => {
		it('should set path based on manifest dir', () => {
			const path = (adapter as unknown as Record<string, string>)._path;
			expect(path).toBe('/test-plugin/statistics.json');
		});

		it('should initialize with default statistics', () => {
			expect(adapter.data).toEqual(DEFAULT_STATISTICS);
		});
	});

	describe('loadData', () => {
		it('should parse existing JSON file via adapter.read', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.read = vi.fn().mockResolvedValue('{"progress":{},"sessions":[],"flashcard":{},"updated_at":"2026-05-18T10:00:00.000Z"}');

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(adapter_.read).toHaveBeenCalledWith('/test-plugin/statistics.json');
			expect(data).toEqual(
				expect.objectContaining({
					progress: {},
					sessions: [],
				}),
			);
		});

		it('should return default data when file is empty', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.read = vi.fn().mockResolvedValue('');

			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(data).toEqual(DEFAULT_STATISTICS);
		});
	});

	describe('saveData', () => {
		it('should write to existing file', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(true);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(DEFAULT_STATISTICS);

			expect(adapter_.write).toHaveBeenCalledWith(
				'/test-plugin/statistics.json',
				expect.any(String),
			);
		});

		it('should create new file when not exists', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(false);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData(DEFAULT_STATISTICS);

			expect(vault.create).toHaveBeenCalledWith(
				'/test-plugin/statistics.json',
				expect.any(String),
			);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.read = vi.fn().mockResolvedValue('{"progress":{},"sessions":[],"flashcard":{},"updated_at":"2026-05-18T10:00:00.000Z"}');

			await adapter.initialize();

			expect(adapter.data).toEqual(
				expect.objectContaining({
					progress: {},
					sessions: [],
				}),
			);
		});

		it('should save data via save method', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(true);
			adapter.set(DEFAULT_STATISTICS);

			await adapter.save();

			expect(adapter_.write).toHaveBeenCalled();
		});
	});
});
