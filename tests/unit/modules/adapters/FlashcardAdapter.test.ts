import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plugin, TFile } from 'obsidian';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { DEFAULT_FLASHCARD_INDEX } from '@/schemas';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

function getVault(plugin: unknown): Record<string, unknown> {
	return ((plugin as Record<string, unknown>).app as Record<string, unknown>).vault as Record<
		string,
		unknown
	>;
}

describe('FlashcardAdapter', () => {
	let plugin: unknown;
	let adapter: FlashcardAdapter;

	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: '/test-plugin/flashcard-index.json', content: '{"flashcards":[],"updated_at":null}' },
		]);
		(plugin as Record<string, unknown>).manifest = { dir: '/test-plugin' };
		adapter = new FlashcardAdapter(plugin as Plugin);
	});

	describe('constructor', () => {
		it('should set path based on manifest dir', () => {
			const path = (adapter as unknown as Record<string, string>)._path;
			expect(path).toBe('/test-plugin/flashcard-index.json');
		});

		it('should initialize with default data', () => {
			expect(adapter.data).toEqual(DEFAULT_FLASHCARD_INDEX);
		});
	});

	describe('loadData', () => {
		it('should parse existing JSON file via vault.adapter.read', async () => {
			const data = await (adapter as unknown as Record<string, () => Promise<unknown>>).loadData();

			expect(data).toEqual({ flashcards: [], updated_at: null });
		});

		it('should throw when file not found', async () => {
			// Remove the file from fileMap so adapter.read throws
			const vault = getVault(plugin);
			(vault.fileMap as Map<string, unknown>).delete('/test-plugin/flashcard-index.json');

			await expect(
				(adapter as unknown as Record<string, () => Promise<unknown>>).loadData(),
			).rejects.toThrow('File not found');
		});
	});

	describe('saveData', () => {
		it('should write to existing file', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(true);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData({
				flashcards: [],
				updated_at: null,
			});

			expect(adapter_.write).toHaveBeenCalledWith(
				'/test-plugin/flashcard-index.json',
				expect.any(String),
			);
		});

		it('should create new file when not exists', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(false);

			await (adapter as unknown as Record<string, (d: unknown) => Promise<void>>).saveData({
				flashcards: [],
				updated_at: null,
			});

			expect(vault.create).toHaveBeenCalledWith(
				'/test-plugin/flashcard-index.json',
				expect.any(String),
			);
		});
	});

	describe('integration with BaseAdapter', () => {
		it('should initialize with loaded data', async () => {
			const vault = getVault(plugin);
			vault.getAbstractFileByPath = vi
				.fn()
				.mockReturnValue(
					new (TFile as unknown as new (path: string) => TFile)(
						'/test-plugin/flashcard-index.json',
					),
				);
			vault.read = vi.fn().mockResolvedValue('{"flashcards":[],"updated_at":null}');

			await adapter.initialize();

			expect(adapter.data).toEqual({ flashcards: [], updated_at: null });
		});

		it('should save data via save method', async () => {
			const vault = getVault(plugin);
			const adapter_ = vault.adapter as Record<string, unknown>;
			adapter_.exists = vi.fn().mockResolvedValue(true);
			adapter.set({ flashcards: [], updated_at: null });

			await adapter.save();

			expect(adapter_.write).toHaveBeenCalled();
		});
	});
});
