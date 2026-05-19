import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Plugin } from 'obsidian';
import { FlascardIndexer, buildFlashcardQueryPredicate } from '@/modules/indexers/FlashcardIndexer';
import { FlashcardParser } from '@/modules/parsers/FlashcardParser';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	FlashcardReviewSessionScoreEvent,
	FlashcardIndexRecalcRequestEvent,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexCreateEvent,
	FlashcardIndexUpdateEvent,
	FlashcardIndexDeleteEvent,
	FlashcardIndexRecalcResponseEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexInitializeEvent,
	FlashcardIndexQueryResponseEvent,
	IndexAction,
} from '@/modules/events';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import { createFlashcardMetadata, createFlashcardYaml } from '../../../helpers/factories';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { IEvent } from '@/interfaces/IEvent';

describe('FlascardIndexer', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let parser: FlashcardParser;
	let adapter: FlashcardAdapter;
	let settings: IAdapter<PluginSettings>;
	let indexer: FlascardIndexer;
	let capturedEvents: IEvent[];

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-18T10:00:00.000Z'));
		resetSingletons();
		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		plugin = createMockPlugin([]);
		(plugin as unknown as Record<string, unknown>).manifest = { dir: '/test-plugin' };

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

		parser = new FlashcardParser(plugin as unknown as Plugin, settings);
		adapter = new FlashcardAdapter(plugin as unknown as Plugin);
		indexer = new FlascardIndexer(parser, adapter, settings);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('constructor', () => {
		it('should subscribe to EventBus on construction', () => {
			resetSingletons();
			const subscribeSpy = vi.spyOn(EventBus.instance, 'subscribe');

			new FlascardIndexer(parser, adapter, settings);

			expect(subscribeSpy).toHaveBeenCalled();
		});
	});

	describe('EventBus subscription handling', () => {
		it('should handle review score event by updating card', () => {
			const metadata = createFlashcardMetadata();
			indexer.create('00000000-0000-0000-0000-000000000000', metadata);

			const reviewData = {
				...createFlashcardYaml(),
				filepath: 'test.md',
				rating: 3,
			};
			EventBus.instance.publish(new FlashcardReviewSessionScoreEvent(reviewData));

			const updated = indexer.get('00000000-0000-0000-0000-000000000000');
			expect(updated).toBeDefined();
		});

		it('should handle recalc request by emitting recalc response', () => {
			EventBus.instance.publish(new FlashcardIndexRecalcRequestEvent());

			const recalcEvent = capturedEvents.find((e) => e.isType(FlashcardIndexRecalcResponseEvent.type));
			expect(recalcEvent).toBeDefined();
			expect((recalcEvent as unknown as { data: { total: number } }).data.total).toBe(0);
		});

		it('should handle query request by emitting query response', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata({ decks: ['Math'] }));
			capturedEvents = [];

			EventBus.instance.publish(
				new FlashcardIndexQueryRequestEvent({
					predicate: () => true,
					deckFilter: 'Math',
				}),
			);

			const queryEvent = capturedEvents.find((e) => e.isType(FlashcardIndexQueryResponseEvent.type));
			expect(queryEvent).toBeDefined();
			expect((queryEvent as unknown as { data: unknown[] }).data).toHaveLength(1);
		});
	});

	describe('emit routing', () => {
		it('should emit Create event with entity data', () => {
			capturedEvents = [];
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexCreateEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: { uuid: string } }).data.uuid).toBe('00000000-0000-0000-0000-000000000000');
		});

		it('should emit Update event with updated entity', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			capturedEvents = [];
			indexer.update('00000000-0000-0000-0000-000000000000', { status: 'PAUSED' as never });

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexUpdateEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: { status: string } }).data.status).toBe('PAUSED');
		});

		it('should emit Delete event with deleted entity', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			capturedEvents = [];
			indexer.delete('00000000-0000-0000-0000-000000000000');

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexDeleteEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: { uuid: string } }).data.uuid).toBe('00000000-0000-0000-0000-000000000000');
		});

		it('should emit Recalc response with all flashcards and total count', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			capturedEvents = [];
			indexer.emit(IndexAction.Recalc);

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexRecalcResponseEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: { total: number } }).data.total).toBe(1);
		});

		it('should emit Save event', () => {
			capturedEvents = [];
			indexer.emit(IndexAction.Save);

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexSaveEvent.type));
			expect(event).toBeDefined();
		});

		it('should emit Initialize event', () => {
			capturedEvents = [];
			indexer.emit(IndexAction.Initialize);

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexInitializeEvent.type));
			expect(event).toBeDefined();
		});

		it('should emit Query response with result data', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			capturedEvents = [];
			const result = [indexer.get('00000000-0000-0000-0000-000000000000')!];
			indexer.emit(IndexAction.Query, result);

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexQueryResponseEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: unknown[] }).data).toHaveLength(1);
		});
	});

	describe('initialize', () => {
		it('should load adapter data into cache', async () => {
			vi.spyOn(adapter, 'initialize').mockResolvedValue(undefined);
			vi.spyOn(parser, 'parseAll').mockResolvedValue([]);

			await indexer.initialize();

			expect(adapter.initialize).toHaveBeenCalled();
		});

		it('should parse all flashcards and merge into cache', async () => {
			vi.spyOn(adapter, 'initialize').mockResolvedValue(undefined);
			vi.spyOn(parser, 'parseAll').mockResolvedValue([
				{ entity: createFlashcardYaml(), filepath: '/flashcards/1.md' },
			]);
			const adapterSetSpy = vi.spyOn(adapter, 'set');

			await indexer.initialize();

			expect(parser.parseAll).toHaveBeenCalledWith('/flashcards');
			expect(adapterSetSpy).toHaveBeenCalled();
		});

		it('should emit Initialize event after completion', async () => {
			vi.spyOn(adapter, 'initialize').mockResolvedValue(undefined);
			vi.spyOn(parser, 'parseAll').mockResolvedValue([]);
			capturedEvents = [];

			await indexer.initialize();

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexInitializeEvent.type));
			expect(event).toBeDefined();
			expect((event as unknown as { data: { total: number } }).data.total).toBe(0);
		});
	});

	describe('save', () => {
		it('should dump cache to adapter and save', async () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata());
			const adapterSetSpy = vi.spyOn(adapter, 'set');
			const adapterSaveSpy = vi.spyOn(adapter, 'save').mockResolvedValue(undefined);

			await indexer.save();

			expect(adapterSetSpy).toHaveBeenCalled();
			expect(adapterSaveSpy).toHaveBeenCalled();
		});

		it('should emit Save event', async () => {
			vi.spyOn(adapter, 'set');
			vi.spyOn(adapter, 'save').mockResolvedValue(undefined);
			capturedEvents = [];

			await indexer.save();

			const event = capturedEvents.find((e) => e.isType(FlashcardIndexSaveEvent.type));
			expect(event).toBeDefined();
		});
	});

	describe('_findByFilepath', () => {
		it('should find flashcard by filepath', () => {
			indexer.create('00000000-0000-0000-0000-000000000000', createFlashcardMetadata({ file: 'test.md' }));

			const result = (indexer as unknown as Record<string, (p: string) => unknown>)._findByFilepath(
				'test.md',
			);

			expect((result as { uuid: string }).uuid).toBe('00000000-0000-0000-0000-000000000000');
		});

		it('should return undefined when not found', () => {
			const result = (indexer as unknown as Record<string, (p: string) => unknown>)._findByFilepath(
				'missing.md',
			);

			expect(result).toBeUndefined();
		});
	});

	describe('watcher handlers', () => {
		beforeEach(() => {
			vi.spyOn(adapter, 'save').mockResolvedValue(undefined);
		});

		it('_handleWatcherCreate should upsert new flashcard', async () => {
			vi.spyOn(parser, 'parseMetadata').mockResolvedValue({
				entity: createFlashcardYaml(),
				filepath: '/flashcards/new.md',
			});

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherCreate({
				path: '/flashcards/new.md',
			});

			expect(indexer.get('00000000-0000-0000-0000-000000000000')).toBeDefined();
		});

		it('_handleWatcherCreate should ignore files outside watched dir', async () => {
			const parseSpy = vi.spyOn(parser, 'parseMetadata');

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherCreate({
				path: '/other/file.md',
			});

			expect(parseSpy).not.toHaveBeenCalled();
		});

		it('_handleWatcherModify should update existing flashcard', async () => {
			indexer.create(
				'00000000-0000-0000-0000-000000000000',
				createFlashcardMetadata({ file: '/flashcards/old.md' }),
			);
			vi.spyOn(parser, 'parseMetadata').mockResolvedValue({
				entity: createFlashcardYaml({ status: 'PAUSED' as never }),
				filepath: '/flashcards/old.md',
			});

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherModify({
				path: '/flashcards/old.md',
			});

			expect(indexer.get('00000000-0000-0000-0000-000000000000')?.status).toBe('PAUSED');
		});

		it('_handleWatcherDelete should remove flashcard', async () => {
			indexer.create(
				'00000000-0000-0000-0000-000000000000',
				createFlashcardMetadata({ file: '/flashcards/del.md' }),
			);

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherDelete({
				path: '/flashcards/del.md',
			});

			expect(indexer.get('00000000-0000-0000-0000-000000000000')).toBeUndefined();
		});

		it('_handleWatcherRename should update filepath', async () => {
			indexer.create(
				'00000000-0000-0000-0000-000000000000',
				createFlashcardMetadata({ file: '/flashcards/old.md' }),
			);

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherRename({
				path: '/flashcards/new.md',
				oldPath: '/flashcards/old.md',
			});

			expect(indexer.get('00000000-0000-0000-0000-000000000000')?.file).toBe('/flashcards/new.md');
		});

		it('_handleWatcherRename should treat as create when old path not found', async () => {
			vi.spyOn(parser, 'parseMetadata').mockResolvedValue({
				entity: createFlashcardYaml(),
				filepath: '/flashcards/new.md',
			});

			await (indexer as unknown as Record<string, (d: unknown) => Promise<void>>)._handleWatcherRename({
				path: '/flashcards/new.md',
				oldPath: '/flashcards/missing.md',
			});

			expect(indexer.get('00000000-0000-0000-0000-000000000000')).toBeDefined();
		});
	});
});

describe('buildFlashcardQueryPredicate', () => {
	it('should return base predicate when no deck filter', () => {
		const base = vi.fn().mockReturnValue(true);
		const predicate = buildFlashcardQueryPredicate({ predicate: base });
		const card = createFlashcardMetadata();

		expect(predicate(card)).toBe(true);
		expect(base).toHaveBeenCalledWith(card);
	});

	it('should filter by exact deck name', () => {
		const base = vi.fn().mockReturnValue(true);
		const predicate = buildFlashcardQueryPredicate({ predicate: base, deckFilter: 'Math' });
		const cardWithDeck = createFlashcardMetadata({ decks: ['Math'] });
		const cardWithoutDeck = createFlashcardMetadata({ decks: [] });

		expect(predicate(cardWithDeck)).toBe(true);
		expect(predicate(cardWithoutDeck)).toBe(false);
	});

	it('should filter uncategorized cards', () => {
		const base = vi.fn().mockReturnValue(true);
		const predicate = buildFlashcardQueryPredicate({ predicate: base, deckFilter: 'Uncategorized' });
		const uncategorized = createFlashcardMetadata({ decks: [] });
		const categorized = createFlashcardMetadata({ decks: ['Math'] });

		expect(predicate(uncategorized)).toBe(true);
		expect(predicate(categorized)).toBe(false);
	});

	it('should return false when base predicate returns false', () => {
		const base = vi.fn().mockReturnValue(false);
		const predicate = buildFlashcardQueryPredicate({ predicate: base, deckFilter: 'Math' });
		const card = createFlashcardMetadata({ decks: ['Math'] });

		expect(predicate(card)).toBe(false);
	});
});
