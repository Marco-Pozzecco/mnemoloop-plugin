import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParseResult } from '@/interfaces/parser/utils';
import {
	EventBus,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseResponseEvent,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { ManageController } from '@/ui/controllers/ManageController';
import { manageStore } from '@/ui/store/manage.store';
import { Notice } from 'obsidian';
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
		vi.mocked(Notice).mockClear();
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

		await EventBus.instance.publish(new FlashcardIndexStateEvent({ flashcards: cards, total: 1 }));

		expect(manageStore.state.flashcards).toEqual(cards);
		expect(manageStore.state.previews).toEqual({});
		controller.dispose();
	});

	it('publishes a delete request with the card uuid and removes it optimistically', () => {
		const card = createFlashcardMetadata({ uuid: 'uuid-1', file: 'a.md' });
		manageStore.setFlashcards([card, createFlashcardMetadata({ uuid: 'uuid-2', file: 'b.md' })]);
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

	it('publishes one update request with content, decks, source, and status', async () => {
		const card = makeBasicParseResult('a.md', 'Front').entity!;
		manageStore.setFlashcards([createFlashcardMetadata({ uuid: card.uuid, file: 'a.md' })]);
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		const promise = controller.updateCard(card, {
			content: { meta_type: CardType.Basic, front: 'Updated', back: 'Back' },
			decks: ['Math'],
			source: '[[notes]]',
			status: CardStatus.PAUSED,
		});

		const request = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterUpdateRequestEvent)
			.find((event) => event instanceof FlashcardWriterUpdateRequestEvent);
		expect(request?.data).toMatchObject({
			uuid: card.uuid,
			decks: ['Math'],
			source: '[[notes]]',
			status: CardStatus.PAUSED,
		});

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'a.md',
				requestId: request!.id,
				success: true,
			}),
		);

		await expect(promise).resolves.toBe(true);
		controller.dispose();
	});

	it('resolves false when the writer reports a failed update', async () => {
		const card = makeBasicParseResult('a.md', 'Front').entity!;
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		const promise = controller.updateCard(card, {
			content: { meta_type: CardType.Basic, front: 'Updated', back: 'Back' },
			decks: [],
			source: null,
			status: CardStatus.ACTIVE,
		});

		const request = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterUpdateRequestEvent)
			.find((event) => event instanceof FlashcardWriterUpdateRequestEvent);

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'a.md',
				requestId: request!.id,
				success: false,
			}),
		);

		await expect(promise).resolves.toBe(false);
		controller.dispose();
	});

	it('ignores an update response for a different request', async () => {
		const card = makeBasicParseResult('a.md', 'Front').entity!;
		const controller = new ManageController();

		const promise = controller.updateCard(card, {
			content: { meta_type: CardType.Basic, front: 'Updated', back: 'Back' },
			decks: [],
			source: null,
			status: CardStatus.ACTIVE,
		});

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath: 'a.md',
				requestId: 'other-request',
				success: true,
			}),
		);

		let settled = false;
		void promise.then(() => (settled = true));
		await Promise.resolve();
		expect(settled).toBe(false);
		controller.dispose();
	});

	it('creates a card and adds the written file to the store', async () => {
		manageStore.reset();
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		const promise = controller.createCard({
			content: { meta_type: CardType.Basic, front: 'Front', back: 'Back' },
			decks: ['Math'],
			source: null,
		});

		const request = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterCreateRequestEvent)
			.find((event) => event instanceof FlashcardWriterCreateRequestEvent);
		expect(request?.data).toMatchObject({ decks: ['Math'], source: null });

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: '/flashcards/new.md',
				requestId: request!.id,
				success: true,
			}),
		);
		await expect(promise).resolves.toBe(true);

		// The controller reads the new file so the row appears without waiting for the index.
		await EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: createFlashcardYaml({ uuid: 'uuid-new' }),
				stats: {
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-01T00:00:00.000Z',
				},
				filepath: '/flashcards/new.md',
				success: true,
			}),
		);

		expect(manageStore.state.flashcards).toHaveLength(1);
		expect(manageStore.state.flashcards[0]).toMatchObject({
			uuid: 'uuid-new',
			file: '/flashcards/new.md',
		});
		controller.dispose();
	});

	it('resolves false and adds nothing when the create write fails', async () => {
		manageStore.reset();
		const controller = new ManageController();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');

		const promise = controller.createCard({
			content: { meta_type: CardType.Basic, front: 'Front', back: 'Back' },
			decks: [],
			source: null,
		});

		const request = publishSpy.mock.calls
			.map(([event]) => event as FlashcardWriterCreateRequestEvent)
			.find((event) => event instanceof FlashcardWriterCreateRequestEvent);

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: '/flashcards/new.md',
				requestId: request!.id,
				success: false,
			}),
		);

		await expect(promise).resolves.toBe(false);
		expect(manageStore.state.flashcards).toEqual([]);
		controller.dispose();
	});

	it('ignores a create response for a different request', async () => {
		manageStore.reset();
		const controller = new ManageController();

		const promise = controller.createCard({
			content: { meta_type: CardType.Basic, front: 'Front', back: 'Back' },
			decks: [],
			source: null,
		});

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: '/flashcards/other.md',
				requestId: 'other-request',
				success: true,
			}),
		);

		let settled = false;
		void promise.then(() => (settled = true));
		await Promise.resolve();
		expect(settled).toBe(false);
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
		expect(Notice).toHaveBeenCalledWith('Couldn’t delete flashcard. It has been restored.');
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
		expect(Notice).toHaveBeenCalledWith('Flashcard deleted.');
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
