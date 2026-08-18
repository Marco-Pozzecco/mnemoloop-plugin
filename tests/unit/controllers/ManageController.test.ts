import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParseResult } from '@/interfaces/parser/utils';
import {
	EventBus,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardWriterFmResponseEvent,
} from '@/modules/events';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { ManageController } from '@/ui/controllers/ManageController';
import { manageStore } from '@/ui/store/manage.store';
import { createFlashcardMetadata, createFlashcardYaml } from '../../helpers/factories';
import { resetSingletons } from '../../helpers/reset-singletons';

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

describe('ManageController', () => {
	beforeEach(() => {
		resetSingletons();
		manageStore.reset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('init publishes FlashcardIndexGetAllRequestEvent and stores the response', async () => {
		expect(manageStore.state.isLoading).toBe(true);

		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		await controller.init();

		expect(publishSpy).toHaveBeenCalledWith(expect.any(FlashcardIndexGetAllRequestEvent));

		const cards = [createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' })];
		await EventBus.instance.publish(new FlashcardIndexGetAllResponseEvent(cards));

		expect(manageStore.state.flashcards).toEqual(cards);
		expect(manageStore.state.isLoading).toBe(false);
		controller.dispose();
	});

	it('updates flashcards from FlashcardIndexStateEvent and clears stale previews', async () => {
		manageStore.setPreview('a.md', 'stale preview');
		const controller = new ManageController();
		const cards = [createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' })];

		await EventBus.instance.publish(
			new FlashcardIndexStateEvent({ flashcards: cards, total: 1 }),
		);

		expect(manageStore.state.flashcards).toEqual(cards);
		expect(manageStore.state.previews).toEqual({});
		controller.dispose();
	});

	it('publishes an Fm request with filepath when updating status', () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'cards/uuid-1.md' });
		manageStore.setFlashcards([card]);
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		controller.updateStatus(card, CardStatus.PAUSED);

		const fmEvent = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterFmRequestEvent)
			.find((event) => event instanceof FlashcardWriterFmRequestEvent);
		expect(fmEvent?.data.filepath).toBe('cards/uuid-1.md');
		expect(fmEvent?.data.fm.status).toBe(CardStatus.PAUSED);
		expect(manageStore.state.flashcards[0]?.status).toBe(CardStatus.PAUSED);
		controller.dispose();
	});

	it('publishes an Fm request with the updated decks array', () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md', decks: ['Maths'] });
		manageStore.setFlashcards([card]);
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		controller.updateDecks(card, ['Maths', 'Science']);

		const fmEvent = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterFmRequestEvent)
			.find((event) => event instanceof FlashcardWriterFmRequestEvent);
		expect(fmEvent?.data.fm.decks).toEqual(['Maths', 'Science']);
		expect(manageStore.state.flashcards[0]?.decks).toEqual(['Maths', 'Science']);
		controller.dispose();
	});

	it('publishes a delete request with the card uuid and removes it optimistically', () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' });
		manageStore.setFlashcards([
			card,
			createFlashcardMetadata({ uuid: 'uuid-2', file: 'b.md' }),
		]);
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		controller.deleteCard(card);

		const deleteEvent = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterDeleteRequestEvent)
			.find((event) => event instanceof FlashcardWriterDeleteRequestEvent);
		expect(deleteEvent?.data.uuid).toBe('uuid-1');
		expect(manageStore.state.flashcards.map((f) => f.uuid)).toEqual(['uuid-2']);
		controller.dispose();
	});

	it('caches previews from parser responses', async () => {
		const card = createFlashcardMetadata({ card_type: CardType.Basic, file: 'a.md' });
		manageStore.setFlashcards([card]);
		const controller = new ManageController();

		controller.ensurePreviews([card]);

		await EventBus.instance.publish(
			new FlashcardParserParseResponseEvent(makeBasicParseResult('a.md', 'Front text')),
		);

		expect(manageStore.state.previews['a.md']).toBe('Front text');
		controller.dispose();
	});

	it('fetchCard resolves the full parsed card for a filepath', async () => {
		const controller = new ManageController();

		const promise = controller.fetchCard('a.md');
		await EventBus.instance.publish(
			new FlashcardParserParseResponseEvent(makeBasicParseResult('a.md', 'F')),
		);

		const result = await promise;
		expect(result?.card_type).toBe(CardType.Basic);
		expect(result?.content).toEqual({ meta_type: CardType.Basic, front: 'F', back: 'back' });
		controller.dispose();
	});

	it('reconciles status from on-disk metadata after a successful Fm write', async () => {
		const card = createFlashcardMetadata({
			uuid: 'uuid-1',
			file: 'a.md',
			status: CardStatus.ACTIVE,
		});
		manageStore.setFlashcards([card]);
		const controller = new ManageController();

		controller.updateStatus(card, CardStatus.PAUSED);
		expect(manageStore.state.flashcards[0]?.status).toBe(CardStatus.PAUSED);

		// Writer finishes: Fm response fires, controller re-parses on-disk metadata.
		await EventBus.instance.publish(new FlashcardWriterFmResponseEvent({ filepath: 'a.md' }));

		await EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: createFlashcardYaml({ uuid: card.uuid, status: CardStatus.PAUSED }),
				stats: { created_at: card.created_at, updated_at: card.updated_at },
				filepath: 'a.md',
				success: true,
			}),
		);

		expect(manageStore.state.flashcards[0]?.status).toBe(CardStatus.PAUSED);
		controller.dispose();
	});

	it('reverts an optimistic status edit when the Fm write failed', async () => {
		const card = createFlashcardMetadata({
			uuid: 'uuid-1',
			file: 'a.md',
			status: CardStatus.ACTIVE,
		});
		manageStore.setFlashcards([card]);
		const controller = new ManageController();

		controller.updateStatus(card, CardStatus.PAUSED);
		expect(manageStore.state.flashcards[0]?.status).toBe(CardStatus.PAUSED);

		await EventBus.instance.publish(new FlashcardWriterFmResponseEvent({ filepath: 'a.md' }));

		// On-disk truth: write failed, the file still has ACTIVE.
		await EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: createFlashcardYaml({ uuid: card.uuid, status: CardStatus.ACTIVE }),
				stats: { created_at: card.created_at, updated_at: card.updated_at },
				filepath: 'a.md',
				success: true,
			}),
		);

		expect(manageStore.state.flashcards[0]?.status).toBe(CardStatus.ACTIVE);
		controller.dispose();
	});

	it('restores a card when the delete write fails (file still exists)', async () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' });
		manageStore.setFlashcards([card]);
		const controller = new ManageController();

		controller.deleteCard(card);
		expect(manageStore.state.flashcards).toEqual([]);

		await EventBus.instance.publish(new FlashcardWriterDeleteResponseEvent({ filepath: 'a.md' }));

		// File still on disk -> delete failed -> restore the card.
		await EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: createFlashcardYaml({ uuid: card.uuid }),
				stats: { created_at: card.created_at, updated_at: card.updated_at },
				filepath: 'a.md',
				success: true,
			}),
		);

		expect(manageStore.state.flashcards).toHaveLength(1);
		expect(manageStore.state.flashcards[0]?.uuid).toBe('uuid-1');
		controller.dispose();
	});

	it('keeps a card removed when the delete write succeeds (file gone)', async () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' });
		manageStore.setFlashcards([card]);
		const controller = new ManageController();

		controller.deleteCard(card);
		await EventBus.instance.publish(new FlashcardWriterDeleteResponseEvent({ filepath: 'a.md' }));

		// File gone -> parse fails -> card stays removed.
		await EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: null,
				stats: null,
				filepath: 'a.md',
				success: false,
				error: new Error('File not found'),
			}),
		);

		expect(manageStore.state.flashcards).toEqual([]);
		controller.dispose();
	});

	it('preserves previews for unchanged cards across index state events', async () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' });
		manageStore.setFlashcards([card]);
		manageStore.setPreview('a.md', 'cached preview');
		const controller = new ManageController();

		await EventBus.instance.publish(new FlashcardIndexStateEvent({ flashcards: [card], total: 1 }));

		expect(manageStore.state.previews['a.md']).toBe('cached preview');
		controller.dispose();
	});
});
