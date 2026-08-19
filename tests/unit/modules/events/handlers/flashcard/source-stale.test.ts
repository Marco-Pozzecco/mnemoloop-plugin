import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Notice } from 'obsidian';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { EventBus } from '@/modules/events/core/EventBus';
import {
	FlashcardIndexUpdateRequestEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard';
import { VaultModifyEvent } from '@/modules/events/domains/vault';
import { FlashcardStaleOnSourceNoteModifyHandler } from '@/modules/events/handlers/flashcard/source-stale';
import type { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { CardStatus, type FlashcardMetadata } from '@/schemas';
import { IndexKey } from '@/types/indexes';
import { resetSingletons } from '../../../../../helpers/reset-singletons';

interface TestCard {
	uuid: string;
	source: string | null;
	status: CardStatus;
}

type SourceFileLookup = ((path: string) => { basename: string } | null) & {
	mockReturnValue(value: { basename: string } | null): unknown;
};

describe('FlashcardStaleOnSourceNoteModifyHandler', () => {
	let bus: EventBus;
	let cards: TestCard[];
	let query: ReturnType<
		typeof vi.fn<[predicate: (card: FlashcardMetadata) => boolean], FlashcardMetadata[]>
	>;
	let writerRequests: FlashcardWriterUpdateRequestEvent[];
	let handler: FlashcardStaleOnSourceNoteModifyHandler;
	let unsubscribers: Array<() => void>;
	let getFileByPath: SourceFileLookup;
	beforeEach(() => {
		resetSingletons();
		vi.clearAllMocks();
		bus = EventBus.instance;
		cards = [];
		writerRequests = [];
		unsubscribers = [];
		getFileByPath = vi.fn().mockReturnValue({ basename: 'biology' });
		query = vi.fn<[predicate: (card: FlashcardMetadata) => boolean], FlashcardMetadata[]>(
			(predicate) => (cards as unknown as FlashcardMetadata[]).filter(predicate),
		);
		const indexer = { query } as unknown as FlashcardIndexer;
		const deps: IEventRegistryDependencies = {
			plugin: {
				app: {
					vault: {
						getFileByPath,
					},
				},
			} as unknown as IEventRegistryDependencies['plugin'],
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, indexer]]),
			parsers: new Map(),
			writers: new Map(),
			bus,
		};
		handler = new FlashcardStaleOnSourceNoteModifyHandler(deps);

		const unsubscribe = bus.subscribe(FlashcardIndexUpdateRequestEvent, async (event) => {
			const card = cards.find((candidate) => candidate.uuid === event.data.uuid);
			if (card) {
				card.status = event.data.status ?? card.status;
			}
		});
		unsubscribers.push(unsubscribe);
	});

	afterEach(() => {
		for (const unsubscribe of unsubscribers) {
			unsubscribe();
		}
	});

	function registerWriter(successByUuid: Record<string, boolean> = {}): void {
		const unsubscribe = bus.subscribe(FlashcardWriterUpdateRequestEvent, async (event) => {
			writerRequests.push(event);
			await bus.publish(
				new FlashcardWriterUpdateResponseEvent({
					filepath: `/flashcards/${event.data.uuid}.md`,
					requestId: event.id,
					success: successByUuid[event.data.uuid ?? ''] ?? true,
				}),
			);
		});
		unsubscribers.push(unsubscribe);
	}

	function sourceEvent(path = 'notes/biology.md'): VaultModifyEvent {
		return new VaultModifyEvent({ path, entity: 'source_note' });
	}

	function activeCard(uuid: string, source: string | null): TestCard {
		return { uuid, source, status: CardStatus.ACTIVE };
	}

	it('ignores non-source vault entities', async () => {
		cards = [activeCard('card-1', '[[biology]]')];
		registerWriter();

		await handler.handle(new VaultModifyEvent({ path: 'notes/biology.md', entity: 'flashcard' }));

		expect(query).not.toHaveBeenCalled();
		expect(Notice).not.toHaveBeenCalled();
	});

	it('matches only the exact basename wikilink from the source file', async () => {
		cards = [
			activeCard('exact', '[[biology]]'),
			activeCard('path', '[[notes/biology.md]]'),
			activeCard('extensionless', '[[biology.md]]'),
			activeCard('alias', '[[biology|Biology]]'),
			activeCard('heading', '[[biology#Heading]]'),
			activeCard('block', '[[biology#^block]]'),
			activeCard('null', null),
			activeCard('other', '[[other]]'),
			activeCard('other-path', '[[notes/other.md]]'),
		];
		registerWriter();

		await handler.handle(sourceEvent());
		expect(getFileByPath).toHaveBeenCalledWith('notes/biology.md');

		expect(query).toHaveBeenCalledTimes(1);
		expect(writerRequests).toHaveLength(1);
		expect(writerRequests[0].data).toEqual({ uuid: 'exact', status: CardStatus.STALE });
		expect(cards.find((card) => card.uuid === 'exact')?.status).toBe(CardStatus.STALE);
		expect(cards.filter((card) => card.status === CardStatus.STALE)).toHaveLength(1);
		expect(Notice).toHaveBeenCalledWith('1 flashcard became stale');
	});

	it('ignores source events for files missing from the vault', async () => {
		getFileByPath.mockReturnValue(null);
		cards = [activeCard('card-1', '[[biology]]')];
		registerWriter();

		await handler.handle(sourceEvent());

		expect(query).not.toHaveBeenCalled();
		expect(writerRequests).toHaveLength(0);
		expect(Notice).not.toHaveBeenCalled();
	});

	it('does nothing for an empty direct query or already-stale cards', async () => {
		cards = [
			activeCard('other', '[[other]]'),
			{ uuid: 'stale', source: '[[biology]]', status: CardStatus.STALE },
		];
		registerWriter();

		await handler.handle(sourceEvent());

		expect(Notice).not.toHaveBeenCalled();
	});

	it('continues after failed writes and reports only successful transitions', async () => {
		cards = [activeCard('fail', '[[biology]]'), activeCard('success', '[[biology]]')];
		registerWriter({ fail: false, success: true });

		await handler.handle(sourceEvent());

		expect(cards.find((card) => card.uuid === 'fail')?.status).toBe(CardStatus.ACTIVE);
		expect(cards.find((card) => card.uuid === 'success')?.status).toBe(CardStatus.STALE);
		expect(Notice).toHaveBeenCalledWith('1 flashcard became stale');
	});

	it('shows no notification when every writer update fails', async () => {
		cards = [activeCard('fail-1', '[[biology]]'), activeCard('fail-2', '[[biology]]')];
		registerWriter({ 'fail-1': false, 'fail-2': false });
		await handler.handle(sourceEvent());

		expect(writerRequests).toHaveLength(2);
		expect(cards.every((card) => card.status === CardStatus.ACTIVE)).toBe(true);
		expect(Notice).not.toHaveBeenCalled();
	});

	it('uses plural notification text for multiple successful transitions', async () => {
		cards = [activeCard('one', '[[biology]]'), activeCard('two', '[[biology]]')];
		registerWriter();

		await handler.handle(sourceEvent());

		expect(Notice).toHaveBeenCalledWith('2 flashcards became stale');
	});

	it('makes repeated source events idempotent after index updates', async () => {
		cards = [activeCard('card-1', '[[biology]]')];
		registerWriter();

		await handler.handle(sourceEvent());
		vi.clearAllMocks();
		await handler.handle(sourceEvent());

		expect(Notice).not.toHaveBeenCalled();
		expect(writerRequests).toHaveLength(1);
	});
});
