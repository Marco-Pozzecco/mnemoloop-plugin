import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile, Plugin } from 'obsidian';
import type { IAdapter } from '@/interfaces/IAdapter';
import { EventBus } from '@/modules/events/core/EventBus';
import { VaultModifyEvent } from '@/modules/events/domains/vault';
import type { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from '@/schemas/settings';
import type { TagCache } from 'obsidian';
import { createMockMetadataCache, createMockPlugin } from '../../helpers/mock-obsidian';
import { resetSingletons } from '../../helpers/reset-singletons';
import { VaultWatcher } from '@/utils/VaultWatcher';

type ModifyHandler = (file: TFile) => void;

type PublishCall = [event: unknown];

describe('VaultWatcher source-note classification', () => {
	type PublishSpy = {
		mockRestore: () => void;
		mockClear: () => void;
		mock: { calls: PublishCall[] };
	};

	let plugin: ReturnType<typeof createMockPlugin>;
	let settings: PluginSettings;
	let findByFilepath: ReturnType<typeof vi.fn<[filepath: string], unknown>>;
	let publish: PublishSpy;
	let watcher: VaultWatcher;
	let handleModify: ModifyHandler;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();
		plugin = createMockPlugin();
		settings = {
			...DEFAULT_PLUGIN_SETTINGS,
			flashcard: {
				...DEFAULT_PLUGIN_SETTINGS.flashcard,
				watch: { directory: '/flashcards', tags: ['#flashcard'] },
			},
			source_note: { watch: { directory: '', tags: [] } },
			debounce_timeout_ms: 100,
		};
		findByFilepath = vi.fn<[filepath: string], unknown>().mockReturnValue(undefined);
		const indexer = { findByFilepath } as unknown as FlashcardIndexer;
		const adapter = { data: settings } as unknown as IAdapter<PluginSettings>;
		watcher = new VaultWatcher(plugin as unknown as Plugin, adapter, indexer);
		handleModify = (watcher as unknown as { _handleModify: ModifyHandler })._handleModify.bind(
			watcher,
		);
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		publishSpy.mockResolvedValue('event-id');
		publish = publishSpy;
	});

	afterEach(() => {
		watcher.dispose();
		publish.mockRestore();
		vi.useRealTimers();
	});

	function file(path: string): TFile {
		const result: unknown = Object.create(TFile.prototype);
		if (!(result instanceof TFile)) {
			throw new Error('Failed to create test TFile');
		}
		result.path = path;
		result.basename = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
		result.extension = 'md';
		result.stat = { ctime: Date.now() - 10_000, mtime: Date.now(), size: 0 };
		return result;
	}

	function emitModify(path: string): void {
		handleModify(file(path));
		vi.advanceTimersByTime(settings.debounce_timeout_ms);
	}

	function modifyEvents(): VaultModifyEvent[] {
		return (publish.mock.calls as PublishCall[])
			.map(([event]) => event)
			.filter((event): event is VaultModifyEvent => event instanceof VaultModifyEvent);
	}

	it('matches recursively while respecting the path boundary', () => {
		settings.source_note.watch.directory = '/notes';

		emitModify('notes/projects/topic.md');
		expect(modifyEvents()).toHaveLength(1);
		expect(modifyEvents()[0].data).toEqual({
			path: 'notes/projects/topic.md',
			entity: 'source_note',
		});

		publish.mockClear();
		emitModify('notes-archive/topic.md');
		expect(modifyEvents()).toHaveLength(0);
	});

	it('uses complete inline tags without falling back to frontmatter', () => {
		settings.source_note.watch.tags = ['#inline'];
		plugin.app.metadataCache = createMockMetadataCache(
			{ tags: ['frontmatter'] },
			[{ tag: '#inline' } as TagCache],
		);

		emitModify('reference.md');

		expect(modifyEvents()).toHaveLength(1);
	});

	it('falls back to scalar and array frontmatter tags when cache tags are unavailable', () => {
		settings.source_note.watch.tags = ['#frontmatter'];
		plugin.app.metadataCache = createMockMetadataCache({ tags: 'frontmatter' });
		emitModify('reference.md');
		expect(modifyEvents()).toHaveLength(1);

		publish.mockClear();
		plugin.app.metadataCache = createMockMetadataCache({ tags: ['frontmatter'] });
		emitModify('reference.md');
		expect(modifyEvents()).toHaveLength(1);
	});

	it('does not use frontmatter when complete cached tags are empty', () => {
		settings.source_note.watch.tags = ['#frontmatter'];
		plugin.app.metadataCache = createMockMetadataCache({ tags: ['frontmatter'] }, []);

		emitModify('reference.md');

		expect(modifyEvents()).toHaveLength(0);
	});

	it('does not classify notes when source criteria are disabled or unmatched', () => {
		plugin.app.metadataCache = createMockMetadataCache({ tags: ['other'] });
		emitModify('reference.md');
		expect(modifyEvents()).toHaveLength(0);

		publish.mockClear();
		settings.source_note.watch.directory = '/notes';
		emitModify('other/reference.md');
		expect(modifyEvents()).toHaveLength(0);
	});

	it('excludes indexed flashcard files from source-note events', () => {
		settings.source_note.watch.directory = '/notes';
		findByFilepath.mockReturnValue({ uuid: 'card-1', entity: {} });

		emitModify('notes/card.md');

		expect(findByFilepath).toHaveBeenCalledWith('notes/card.md');
		expect(modifyEvents()).toHaveLength(0);
	});

	it('publishes both entities when a file meets both criteria and is not indexed', () => {
		settings.source_note.watch.directory = '/notes';
		settings.flashcard.watch.tags = ['#flashcard'];
		plugin.app.metadataCache = createMockMetadataCache({ tags: ['flashcard'] });

		emitModify('notes/reference.md');

		expect(modifyEvents().map((event) => event.data)).toEqual([
			{ path: 'notes/reference.md', entity: 'flashcard' },
			{ path: 'notes/reference.md', entity: 'source_note' },
		]);
	});

	it('reads live source settings for subsequent modifications', () => {
		settings.source_note.watch.directory = '/notes';
		handleModify(file('notes/reference.md'));
		settings.source_note.watch.directory = '';
		handleModify(file('notes/reference.md'));
		vi.advanceTimersByTime(settings.debounce_timeout_ms);

		expect(modifyEvents()).toHaveLength(0);
	});
});
