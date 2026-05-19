import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Plugin, TFile, TAbstractFile } from 'obsidian';
import { FileWatcherProcessor } from '@/modules/events/processors/FileWatcherProcessor';
import { EventBus } from '@/modules/events/core/EventBus';
import { resetSingletons } from '../../../helpers/reset-singletons';
import { createMockPlugin } from '../../../helpers/mock-obsidian';
import type { IAdapter } from '@/interfaces/IAdapter';
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from '@/schemas/settings';
import {
	FlashcardWatcherCreateEvent,
	FlashcardWatcherModifyEvent,
	FlashcardWatcherDeleteEvent,
	FlashcardWatcherRenameEvent,
} from '@/modules/events/domains/watcher';

function createMockSettingsAdapter(overrides: Partial<PluginSettings> = {}): IAdapter<PluginSettings> {
	const settings: PluginSettings = {
		...DEFAULT_PLUGIN_SETTINGS,
		...overrides,
	};
	return {
		data: settings,
		set: vi.fn(),
		setField: vi.fn(),
		update: vi.fn(),
		save: vi.fn().mockResolvedValue(undefined),
		reset: vi.fn().mockResolvedValue(undefined),
		initialize: vi.fn().mockResolvedValue(undefined),
	} as unknown as IAdapter<PluginSettings>;
}

describe('FileWatcherProcessor', () => {
	let plugin: any;
	let settingsAdapter: IAdapter<PluginSettings>;
	let processor: FileWatcherProcessor;
	let capturedEvents: Array<ReturnType<typeof EventBus.instance.publish> extends string ? unknown : unknown>;
	let vaultEventHandlers: Map<string, (...args: unknown[]) => void>;

	beforeEach(() => {
		resetSingletons();
		vi.useFakeTimers();

		vaultEventHandlers = new Map();
		plugin = createMockPlugin([]);
		plugin.app.vault.on = vi.fn<any, any>().mockImplementation((eventName: string, callback: (...args: unknown[]) => void) => {
			vaultEventHandlers.set(eventName, callback);
			return { id: `evt-${eventName}` };
		});

		settingsAdapter = createMockSettingsAdapter();

		capturedEvents = [];
		EventBus.instance.subscribe((e) => capturedEvents.push(e));

		processor = new FileWatcherProcessor(plugin as unknown as Plugin, settingsAdapter);
	});

	afterEach(() => {
		processor.dispose();
		vi.useRealTimers();
	});

	describe('vault event registration', () => {
		it('should register create event handler via plugin.registerEvent', () => {
			expect(plugin.registerEvent).toHaveBeenCalled();
			expect(plugin.app.vault.on).toHaveBeenCalledWith('create', expect.any(Function));
		});

		it('should register modify event handler via plugin.registerEvent', () => {
			expect(plugin.app.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
		});

		it('should register delete event handler via plugin.registerEvent', () => {
			expect(plugin.app.vault.on).toHaveBeenCalledWith('delete', expect.any(Function));
		});

		it('should register rename event handler via plugin.registerEvent', () => {
			expect(plugin.app.vault.on).toHaveBeenCalledWith('rename', expect.any(Function));
		});
	});

	describe('_handleCreate', () => {
		it('should publish FlashcardWatcherCreateEvent for markdown file in watched directory', () => {
			const handler = vaultEventHandlers.get('create')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherCreateEvent);
			expect((capturedEvents[0] as FlashcardWatcherCreateEvent).data.path).toBe('/flashcards/test.md');
		});

		it('should ignore non-markdown files', () => {
			const handler = vaultEventHandlers.get('create')!;
			const file = new (TFile as any)('/flashcards/test.txt', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(0);
		});

		it('should ignore markdown files outside watched directory and without watched tags', () => {
			const handler = vaultEventHandlers.get('create')!;
			const file = new (TFile as any)('/other/test.md', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(0);
		});

		it('should publish create event for file with watched tags', () => {
			plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({
				frontmatter: { tags: ['flashcard'] },
			});

			const handler = vaultEventHandlers.get('create')!;
			const file = new (TFile as any)('/other/tagged.md', 'tagged');

			handler(file);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherCreateEvent);
		});
	});

	describe('_handleModify', () => {
		it('should debounce and publish FlashcardWatcherModifyEvent for watched files', () => {
			const handler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);
			expect(capturedEvents).toHaveLength(0);

			vi.advanceTimersByTime(500);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherModifyEvent);
			expect((capturedEvents[0] as FlashcardWatcherModifyEvent).data.path).toBe('/flashcards/test.md');
		});

		it('should reset debounce timer on multiple modify events for same file', () => {
			const handler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);
			vi.advanceTimersByTime(300);
			handler(file);
			vi.advanceTimersByTime(300);

			expect(capturedEvents).toHaveLength(0);

			vi.advanceTimersByTime(200);

			expect(capturedEvents).toHaveLength(1);
		});

		it('should ignore files outside watched area', () => {
			const handler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/other/test.md', 'test');

			handler(file);
			vi.advanceTimersByTime(500);

			expect(capturedEvents).toHaveLength(0);
		});

		it('should clear debounce timer when file loses watched tags', () => {
			// First modify - file is watched due to tags
			plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({
				frontmatter: { tags: ['flashcard'] },
			});
			const handler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/other/tagged.md', 'tagged');

			handler(file);
			expect(capturedEvents).toHaveLength(0);

			// Second modify - tags are gone, but path is still in debounce map
			plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({
				frontmatter: { tags: [] },
			});
			handler(file);

			vi.advanceTimersByTime(500);
			expect(capturedEvents).toHaveLength(0);
		});
	});

	describe('_handleDelete', () => {
		it('should publish FlashcardWatcherDeleteEvent for watched markdown file', () => {
			const handler = vaultEventHandlers.get('delete')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherDeleteEvent);
			expect((capturedEvents[0] as FlashcardWatcherDeleteEvent).data.path).toBe('/flashcards/test.md');
		});

		it('should ignore non-markdown files', () => {
			const handler = vaultEventHandlers.get('delete')!;
			const file = new (TFile as any)('/flashcards/test.txt', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(0);
		});

		it('should ignore markdown files outside watched area', () => {
			const handler = vaultEventHandlers.get('delete')!;
			const file = new (TFile as any)('/other/test.md', 'test');

			handler(file);

			expect(capturedEvents).toHaveLength(0);
		});

		it('should clear pending debounce timer for deleted file', () => {
			const modifyHandler = vaultEventHandlers.get('modify')!;
			const deleteHandler = vaultEventHandlers.get('delete')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			modifyHandler(file);
			deleteHandler(file);
			vi.advanceTimersByTime(500);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherDeleteEvent);
		});
	});

	describe('_handleRename', () => {
		it('should publish FlashcardWatcherRenameEvent when old path was in watched directory', () => {
			const handler = vaultEventHandlers.get('rename')!;
			const file = new (TFile as any)('/flashcards/new.md', 'new');

			handler(file, '/flashcards/old.md');

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherRenameEvent);
			expect((capturedEvents[0] as FlashcardWatcherRenameEvent).data.path).toBe('/flashcards/new.md');
			expect((capturedEvents[0] as FlashcardWatcherRenameEvent).data.oldPath).toBe('/flashcards/old.md');
		});

		it('should publish rename event when new path is in watched directory', () => {
			const handler = vaultEventHandlers.get('rename')!;
			const file = new (TFile as any)('/flashcards/moved.md', 'moved');

			handler(file, '/other/moved.md');

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherRenameEvent);
		});

		it('should publish rename event for file with watched tags', () => {
			plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({
				frontmatter: { tags: ['flashcard'] },
			});

			const handler = vaultEventHandlers.get('rename')!;
			const file = new (TFile as any)('/other/tagged.md', 'tagged');

			handler(file, '/other/old.md');

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherRenameEvent);
		});

		it('should ignore non-markdown files', () => {
			const handler = vaultEventHandlers.get('rename')!;
			const file = new (TFile as any)('/flashcards/test.txt', 'test');

			handler(file, '/flashcards/old.txt');

			expect(capturedEvents).toHaveLength(0);
		});

		it('should clear debounce timer for old path', () => {
			const modifyHandler = vaultEventHandlers.get('modify')!;
			const renameHandler = vaultEventHandlers.get('rename')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			modifyHandler(file);
			renameHandler(file, '/flashcards/test.md');
			vi.advanceTimersByTime(500);

			expect(capturedEvents).toHaveLength(1);
			expect(capturedEvents[0]).toBeInstanceOf(FlashcardWatcherRenameEvent);
		});
	});

	describe('_emit routing', () => {
		it('should only publish events for Flashcard entity', () => {
			const handler = vaultEventHandlers.get('create')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);

			const createEvent = capturedEvents.find((e) => e instanceof FlashcardWatcherCreateEvent);
			expect(createEvent).toBeDefined();
		});
	});

	describe('_shouldWatchFile', () => {
		it('should return false for TAbstractFile that is not TFile', () => {
			const abstractFile = new (TAbstractFile as any)('/flashcards/test.md');
			const handler = vaultEventHandlers.get('create')!;

			handler(abstractFile);

			expect(capturedEvents).toHaveLength(0);
		});
	});

	describe('dispose', () => {
		it('should clear all debounce timers', () => {
			const modifyHandler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			modifyHandler(file);
			processor.dispose();
			vi.advanceTimersByTime(500);

			expect(capturedEvents).toHaveLength(0);
		});
	});

	describe('debounce timeout from settings', () => {
		it('should use configured debounce timeout', () => {
			settingsAdapter = createMockSettingsAdapter({ debounce_timeout_ms: 1000 });
			processor.dispose();
			processor = new FileWatcherProcessor(plugin as unknown as Plugin, settingsAdapter);

			const handler = vaultEventHandlers.get('modify')!;
			const file = new (TFile as any)('/flashcards/test.md', 'test');

			handler(file);
			vi.advanceTimersByTime(500);
			expect(capturedEvents).toHaveLength(0);

			vi.advanceTimersByTime(500);
			expect(capturedEvents).toHaveLength(1);
		});
	});
});
