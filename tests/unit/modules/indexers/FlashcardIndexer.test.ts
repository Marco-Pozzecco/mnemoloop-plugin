import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Plugin } from 'obsidian';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { FlashcardParser } from '@/modules/parsers/FlashcardParser';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardMetadata, createFlashcardYaml } from '../../../helpers/factories';
import { resetSingletons } from '../../../helpers/reset-singletons';

describe('FlashcardIndexer', () => {
	let plugin: unknown;
	let parser: FlashcardParser;
	let adapter: FlashcardAdapter;
	let settings: IAdapter<PluginSettings>;
	let indexer: FlashcardIndexer;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-18T10:00:00.000Z'));
		resetSingletons();

		plugin = createMockPlugin([]);
		(plugin as Record<string, unknown>).manifest = { dir: '/test-plugin' };

		settings = {
			data: {
				flashcard: {
					marker: '?',
					watch: { directory: '/flashcards', tags: ['#flashcard'] },
				},
				debounce_timeout_ms: 500,
				enable_soft_delete: true,
				soft_delete_hours: 24,
			},
		} as IAdapter<PluginSettings>;

		parser = new FlashcardParser(plugin as Plugin, settings);
		adapter = new FlashcardAdapter(plugin as Plugin);
		indexer = new FlashcardIndexer(parser, adapter, settings);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('initialize', () => {
		it('should not load adapter data into cache and rebuild from zero', async () => {
			const initializeSpy = vi.spyOn(adapter, 'initialize');
			const card = createFlashcardMetadata();
			adapter.set({ flashcards: [card], updated_at: '2024-01-01T00:00:00.000Z' });
			vi.spyOn(parser, 'parseAll').mockResolvedValue([]);

			await indexer.initialize();

			expect(initializeSpy).not.toHaveBeenCalled();
			expect(indexer.getAll()).toHaveLength(0);
			expect(indexer.get(card.uuid)).toBeUndefined();
		});

		it('should parse all flashcards and merge into cache', async () => {
			vi.spyOn(parser, 'parseAll').mockResolvedValue([
				{
					entity: createFlashcardYaml(),
					filepath: '/flashcards/1.md',
					success: true,
					stats: { created_at: '2026-05-18T10:00:00.000Z', updated_at: '2026-05-18T10:00:00.000Z' },
				},
			]);
			const adapterUpdateSpy = vi.spyOn(adapter, 'update');

			await indexer.initialize();

			expect(parser.parseAll).toHaveBeenCalledWith('/flashcards');
			expect(adapterUpdateSpy).toHaveBeenCalled();
		});

		it('should use new timestamps when re-parsing existing flashcards', async () => {
			const oldTimestamp = '2024-01-15T08:30:00.000Z';
			const newTimestamp = '2026-05-18T10:00:00.000Z';
			const existingCard = createFlashcardMetadata({
				uuid: '11111111-1111-1111-a111-111111111111',
				created_at: oldTimestamp,
				updated_at: oldTimestamp,
			});
			adapter.set({ flashcards: [existingCard], updated_at: oldTimestamp });

			vi.spyOn(parser, 'parseAll').mockResolvedValue([
				{
					entity: createFlashcardYaml({ uuid: existingCard.uuid }),
					stats: { created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
					filepath: '/flashcards/1.md',
					success: true,
				},
			]);

			await indexer.initialize();

			const result = indexer.get(existingCard.uuid)!;
			expect(result.created_at).toBe(newTimestamp);
			expect(result.updated_at).toBe(newTimestamp);
		});
	});

	describe('save', () => {
		it('should dump cache to adapter and save', async () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			const adapterUpdateSpy = vi.spyOn(adapter, 'update');
			const adapterSaveSpy = vi.spyOn(adapter, 'save').mockResolvedValue(undefined);

			await indexer.save();

			expect(adapterUpdateSpy).toHaveBeenCalled();
			expect(adapterSaveSpy).toHaveBeenCalled();
		});
	});

	describe('findByFilepath', () => {
		it('should find flashcard by filepath', () => {
			indexer.create(
				'00000000-0000-0000-0000-000000000000',
				createFlashcardMetadata({ file: 'test.md' }),
			);

			const result = indexer.findByFilepath('test.md');

			expect(result?.uuid).toBe('00000000-0000-0000-0000-000000000000');
		});

		it('should return undefined when not found', () => {
			const result = indexer.findByFilepath('missing.md');

			expect(result).toBeUndefined();
		});
	});
});
