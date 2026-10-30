import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from 'obsidian';
import type { ParseResult } from '@/interfaces/parser/utils';
import {
	EventBus,
	FlashcardIndexStateEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { SidebarController } from '@/ui/controllers/SidebarController';
import { sidebarStore } from '@/ui/store/sidebar.store';
import { createFlashcardMetadata } from '../../helpers/factories';
import { createMockMetadataCache } from '../../helpers/mock-obsidian';
import { resetSingletons } from '../../helpers/reset-singletons';

const NOTE_PATH = 'notes/biology.md';

/** Link targets the way Obsidian resolves a stored source link. */
const LINK_TARGETS: Record<string, string> = {
	'notes/biology.md': NOTE_PATH,
	'notes/biology': NOTE_PATH,
	biology: NOTE_PATH,
	'notes/chemistry.md': 'notes/chemistry.md',
	'notes/chemistry': 'notes/chemistry.md',
	chemistry: 'notes/chemistry.md',
	'notes/other.md': 'notes/other.md',
};

/** A minimal workspace double: a settable active file and dispatchable leaf changes. */
function createWorkspace() {
	const handlers = new Map<string, Array<() => void>>();
	let activeFile: unknown = null;
	return {
		getActiveFile: () => activeFile,
		setActiveFile: (file: unknown) => {
			activeFile = file;
		},
		on: (event: string, callback: () => void) => {
			const list = handlers.get(event) ?? [];
			list.push(callback);
			handlers.set(event, list);
			return { event, callback };
		},
		offref: (ref: { event: string; callback: () => void }) => {
			const list = handlers.get(ref.event);
			if (!list) return;
			const index = list.indexOf(ref.callback);
			if (index >= 0) list.splice(index, 1);
		},
		emit: (event: string) => {
			for (const callback of [...(handlers.get(event) ?? [])]) callback();
		},
	};
}

function createApp(
	workspace: ReturnType<typeof createWorkspace>,
	linkTargets: Record<string, string> = LINK_TARGETS,
): App {
	return {
		workspace,
		metadataCache: createMockMetadataCache(undefined, undefined, { linkTargets }),
	} as unknown as App;
}

function markdownFile(path: string): { path: string; basename: string; extension: string } {
	return {
		path,
		basename: path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''),
		extension: 'md',
	};
}

function makeBasicParseResult(filepath: string, front: string): ParseResult<Flashcard> {
	const metadata = createFlashcardMetadata({ card_type: CardType.Basic, file: filepath });
	return {
		entity: {
			...metadata,
			content: { meta_type: CardType.Basic, front, back: 'back' },
		} as unknown as Flashcard,
		stats: { created_at: metadata.created_at, updated_at: metadata.updated_at },
		filepath,
		success: true,
	};
}

async function publishCards(cards: ReturnType<typeof createFlashcardMetadata>[]): Promise<void> {
	await EventBus.instance.publish(
		new FlashcardIndexStateEvent({ flashcards: cards, total: cards.length }),
	);
}

describe('SidebarController', () => {
	let workspace: ReturnType<typeof createWorkspace>;
	let controller: SidebarController;

	beforeEach(() => {
		resetSingletons();
		sidebarStore.reset();
		workspace = createWorkspace();
		workspace.setActiveFile(markdownFile(NOTE_PATH));
		controller = new SidebarController(createApp(workspace));
	});

	afterEach(() => {
		controller.dispose();
		vi.restoreAllMocks();
	});

	it('lists every card whose source link resolves to the active note', async () => {
		const matching = [
			createFlashcardMetadata({
				uuid: 'exact',
				file: 'cards/exact.md',
				source: `[[${NOTE_PATH}]]`,
			}),
			createFlashcardMetadata({
				uuid: 'nomd',
				file: 'cards/nomd.md',
				source: '[[notes/biology]]',
			}),
			createFlashcardMetadata({ uuid: 'base', file: 'cards/base.md', source: '[[biology]]' }),
			createFlashcardMetadata({
				uuid: 'alias',
				file: 'cards/alias.md',
				source: '[[notes/biology.md|Biology]]',
			}),
			createFlashcardMetadata({
				uuid: 'heading',
				file: 'cards/heading.md',
				source: '[[notes/biology.md#Heading]]',
			}),
			createFlashcardMetadata({
				uuid: 'block',
				file: 'cards/block.md',
				source: '[[notes/biology.md#^block]]',
			}),
		];
		const excluded = [
			createFlashcardMetadata({ uuid: 'null', file: 'cards/null.md', source: null }),
			createFlashcardMetadata({
				uuid: 'other',
				file: 'cards/other.md',
				source: '[[notes/other.md]]',
			}),
			createFlashcardMetadata({
				uuid: 'missing',
				file: 'cards/missing.md',
				source: '[[notes/missing.md]]',
			}),
		];

		await publishCards([...matching, ...excluded]);

		expect(sidebarStore.state.cards.map((card) => card.uuid)).toEqual([
			'exact',
			'nomd',
			'base',
			'alias',
			'heading',
			'block',
		]);
	});

	it('resolves each source from the card file it is written in', async () => {
		const app = createApp(workspace);
		const spy = vi.spyOn(app.metadataCache, 'getFirstLinkpathDest');
		controller.dispose();
		controller = new SidebarController(app);

		const relative = createFlashcardMetadata({
			uuid: 'relative',
			file: 'cards/relative.md',
			source: '[[../notes/biology]]',
		});
		await publishCards([relative]);

		expect(spy).toHaveBeenCalledWith('../notes/biology', 'cards/relative.md');
	});

	it('excludes a soft-deleted card that matches the active note', async () => {
		const deleted = createFlashcardMetadata({
			uuid: 'deleted',
			file: 'cards/deleted.md',
			source: `[[${NOTE_PATH}]]`,
			status: CardStatus.DELETED,
		});

		await publishCards([deleted]);

		expect(sidebarStore.state.cards).toEqual([]);
	});

	it('recomputes the list when the active note changes', async () => {
		const forBiology = createFlashcardMetadata({
			uuid: 'bio',
			file: 'cards/bio.md',
			source: '[[notes/biology.md]]',
		});
		const forChemistry = createFlashcardMetadata({
			uuid: 'chem',
			file: 'cards/chem.md',
			source: '[[notes/chemistry.md]]',
		});
		await publishCards([forBiology, forChemistry]);
		expect(sidebarStore.state.cards.map((card) => card.uuid)).toEqual(['bio']);

		workspace.setActiveFile(markdownFile('notes/chemistry.md'));
		workspace.emit('active-leaf-change');

		expect(sidebarStore.state.activeNote?.path).toBe('notes/chemistry.md');
		expect(sidebarStore.state.cards.map((card) => card.uuid)).toEqual(['chem']);
	});

	it('falls back to the no-active-note state for a non-markdown file', async () => {
		workspace.setActiveFile(markdownFile(NOTE_PATH));
		await publishCards([
			createFlashcardMetadata({ uuid: 'bio', file: 'cards/bio.md', source: '[[notes/biology.md]]' }),
		]);

		workspace.setActiveFile({ path: 'attachments/diagram.png', basename: 'diagram', extension: 'png' });
		workspace.emit('active-leaf-change');

		expect(sidebarStore.state.activeNote).toBeNull();
		expect(sidebarStore.state.cards).toEqual([]);
	});

	it('populates and caches a listed card preview from a parse response', async () => {
		const card = createFlashcardMetadata({
			uuid: 'bio',
			file: 'cards/bio.md',
			source: `[[${NOTE_PATH}]]`,
		});
		await publishCards([card]);

		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		await EventBus.instance.publish(
			new FlashcardParserParseResponseEvent(
				makeBasicParseResult(card.file, 'What is a cell?'),
			),
		);

		expect(sidebarStore.state.previews[card.file]).toBe('What is a cell?');

		// A second state event for the same card must not re-request the preview.
		publishSpy.mockClear();
		await publishCards([card]);
		const requests = publishSpy.mock.calls
			.map(([event]) => event)
			.filter((event) => event instanceof FlashcardParserParseRequestEvent);
		expect(requests).toHaveLength(0);
	});

	it('drops and re-requests a cached preview after a successful update', async () => {
		const card = createFlashcardMetadata({
			uuid: 'bio',
			file: 'cards/bio.md',
			source: `[[${NOTE_PATH}]]`,
		});
		await publishCards([card]);
		await EventBus.instance.publish(
			new FlashcardParserParseResponseEvent(
				makeBasicParseResult(card.file, 'Old front'),
			),
		);
		expect(sidebarStore.state.previews[card.file]).toBe('Old front');

		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: card.file,
				success: true,
				requestId: 'request-1',
			}),
		);

		expect(sidebarStore.state.previews[card.file]).toBeUndefined();
		const requests = publishSpy.mock.calls
			.map(([event]) => event)
			.filter((event): event is FlashcardParserParseRequestEvent =>
				event instanceof FlashcardParserParseRequestEvent,
			);
		expect(requests.map((request) => request.data.filepath)).toEqual([card.file]);
	});

	it('keeps the cached preview when a write reports failure', async () => {
		const card = createFlashcardMetadata({
			uuid: 'bio',
			file: 'cards/bio.md',
			source: `[[${NOTE_PATH}]]`,
		});
		await publishCards([card]);
		await EventBus.instance.publish(
			new FlashcardParserParseResponseEvent(
				makeBasicParseResult(card.file, 'Unchanged front'),
			),
		);

		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: card.file,
				success: false,
				requestId: 'request-2',
			}),
		);

		expect(sidebarStore.state.previews[card.file]).toBe('Unchanged front');
		expect(
			publishSpy.mock.calls.filter(
				([event]) => event instanceof FlashcardParserParseRequestEvent,
			),
		).toHaveLength(0);
	});
});
