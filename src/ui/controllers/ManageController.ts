import type { ParseResult } from '@/interfaces/parser/utils';
import { EventBus } from '@/modules/events/core';
import {
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
} from '@/modules/events/domains/flashcard/indexer';
import {
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
} from '@/modules/events/domains/flashcard/parsers';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import { CardStatus } from '@/schemas';
import type { Flashcard, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import { buildCardPreview } from '@/ui/components/views/Manage/utils';
import { Notice } from 'obsidian';
import { manageStore } from '../store/manage.store';

export class ManageController {
	private _unsubscribers: Array<() => void> = [];
	private _pendingPreviews = new Map<string, () => void>();
	private _failedPreviews = new Set<string>();
	/** Pre-mutation card snapshots keyed by filepath, used to restore on failed deletes. */
	private _originals = new Map<string, FlashcardMetadata>();
	/** Pending on-disk metadata reconcilers keyed by filepath. */
	private _pendingReconcile = new Map<string, (result: ParseResult<FlashcardYaml>) => void>();

	constructor() {
		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardIndexStateEvent, async (event) => {
				const previous = manageStore.state.flashcards;
				manageStore.setFlashcards(event.data.flashcards);
				this._failedPreviews.clear();
				this._dropStalePreviews(previous, event.data.flashcards);
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardParserParseResponseEvent, async (event) => {
				const resolve = this._pendingPreviews.get(event.data.filepath);
				if (!resolve) return;
				this._pendingPreviews.delete(event.data.filepath);
				if (event.data.success) {
					manageStore.setPreview(event.data.filepath, buildCardPreview(event.data.entity));
				} else {
					this._failedPreviews.add(event.data.filepath);
				}
				resolve();
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardParserParseMetadataResponseEvent, async (event) => {
				const reconcile = this._pendingReconcile.get(event.data.filepath);
				if (!reconcile) return;
				this._pendingReconcile.delete(event.data.filepath);
				reconcile(event.data);
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardWriterDeleteResponseEvent, async (event) => {
				this._reconcileDelete(event.data.filepath);
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardWriterUpdateResponseEvent, async (event) => {
				// Content may have changed via the edit modal; drop its cached preview.
				manageStore.clearPreviews([event.data.filepath]);
			}),
		);
	}

	async init(): Promise<void> {
		const unsub = EventBus.instance.subscribe(FlashcardIndexGetAllResponseEvent, async (event) => {
			manageStore.setFlashcards(event.data);
			manageStore.setLoading(false);
		});
		this._unsubscribers.push(unsub);

		await EventBus.instance.publish(new FlashcardIndexGetAllRequestEvent());
	}

	/**
	 * Request content previews for any visible card that does not already have
	 * one cached. Responses are correlated by filepath.
	 */
	ensurePreviews(cards: FlashcardMetadata[]): void {
		for (const card of cards) {
			if (manageStore.state.previews[card.file] !== undefined) continue;
			if (this._pendingPreviews.has(card.file)) continue;
			if (this._failedPreviews.has(card.file)) continue;
			this._pendingPreviews.set(card.file, () => {});
			void EventBus.instance.publish(new FlashcardParserParseRequestEvent({ filepath: card.file }));
		}
	}

	/** Fetch the full card (including content) for a filepath. */
	async fetchCard(filepath: string): Promise<Flashcard | null> {
		return new Promise((resolve) => {
			const unsub = EventBus.instance.subscribe(
				FlashcardParserParseResponseEvent,
				async (event) => {
					if (event.data.filepath !== filepath) return;
					unsub();
					resolve(event.data.success ? event.data.entity : null);
				},
			);
			this._unsubscribers.push(unsub);
			void EventBus.instance.publish(new FlashcardParserParseRequestEvent({ filepath }));
		});
	}

	/**
	 * Persist a sheet edit as one write: content, decks, source, and status.
	 * Resolves true when the writer confirms the update.
	 */
	async updateCard(
		card: Flashcard,
		payload: {
			content: Flashcard['content'];
			decks: string[];
			source: string | null;
			status: CardStatus;
		},
	): Promise<boolean> {
		return new Promise((resolve) => {
			const request = new FlashcardWriterUpdateRequestEvent({
				uuid: card.uuid,
				content: payload.content,
				decks: payload.decks,
				source: payload.source,
				status: payload.status,
			} as Partial<Flashcard>);

			const unsub = EventBus.instance.subscribe(
				FlashcardWriterUpdateResponseEvent,
				async (event) => {
					if (event.data.requestId !== request.id) return;
					unsub();
					this._unsubscribers = this._unsubscribers.filter((fn) => fn !== unsub);
					if (event.data.success) {
						// Show the saved values immediately; the index event confirms them later.
						this._applySavedMetadata(card.uuid, payload);
					}
					resolve(event.data.success);
				},
			);

			this._unsubscribers.push(unsub);
			void EventBus.instance.publish(request);
		});
	}

	/** Create a card from the sheet; resolves true when the writer confirms the write. */
	async createCard(payload: {
		content: Flashcard['content'];
		decks: string[];
		source: string | null;
	}): Promise<boolean> {
		return new Promise((resolve) => {
			const request = new FlashcardWriterCreateRequestEvent(payload);

			const unsub = EventBus.instance.subscribe(
				FlashcardWriterCreateResponseEvent,
				async (event) => {
					if (event.data.requestId !== request.id) return;
					unsub();
					this._unsubscribers = this._unsubscribers.filter((fn) => fn !== unsub);
					if (event.data.success) this._addCreatedCard(event.data.filepath);
					resolve(event.data.success);
				},
			);

			this._unsubscribers.push(unsub);
			void EventBus.instance.publish(request);
		});
	}

	/** Optimistically remove the card and hard-delete its file. */
	deleteCard(card: FlashcardMetadata): void {
		if (!this._originals.has(card.file)) {
			this._originals.set(card.file, card);
		}
		manageStore.setFlashcards(manageStore.state.flashcards.filter((c) => c.uuid !== card.uuid));
		void EventBus.instance.publish(new FlashcardWriterDeleteRequestEvent({ uuid: card.uuid }));
	}

	/**
	 * Add the freshly written card to the store so the row appears immediately.
	 * The index watcher still owns the canonical order and metadata.
	 */
	private _addCreatedCard(filepath: string): void {
		const unsub = EventBus.instance.subscribe(
			FlashcardParserParseMetadataResponseEvent,
			async (event) => {
				if (event.data.filepath !== filepath || !event.data.success || !event.data.entity) return;
				unsub();
				this._unsubscribers = this._unsubscribers.filter((fn) => fn !== unsub);

				const metadata: FlashcardMetadata = {
					...event.data.entity,
					file: filepath,
					created_at: event.data.stats?.created_at ?? new Date().toISOString(),
					updated_at: event.data.stats?.updated_at ?? new Date().toISOString(),
				};
				if (manageStore.state.flashcards.some((card) => card.uuid === metadata.uuid)) return;
				manageStore.setFlashcards([...manageStore.state.flashcards, metadata]);
			},
		);

		this._unsubscribers.push(unsub);
		void EventBus.instance.publish(new FlashcardParserParseMetadataRequestEvent({ filepath }));
	}

	/** Show saved metadata immediately; the debounced index event confirms it later. */
	private _applySavedMetadata(
		uuid: string,
		payload: { decks: string[]; source: string | null; status: CardStatus },
	): void {
		manageStore.setFlashcards(
			manageStore.state.flashcards.map((card) =>
				card.uuid === uuid
					? { ...card, decks: payload.decks, source: payload.source, status: payload.status }
					: card,
			),
		);
	}

	dispose(): void {
		for (const unsub of this._unsubscribers) {
			unsub();
		}
		this._unsubscribers = [];
	}

	/** After a delete write completes, restore the card if the file still exists. */
	private _reconcileDelete(filepath: string): void {
		this._pendingReconcile.set(filepath, (result) => {
			const original = this._originals.get(filepath);
			this._originals.delete(filepath);
			if (!original) return;
			if (result.success && result.entity) {
				manageStore.setFlashcards([...manageStore.state.flashcards, original]);
				new Notice('Couldn’t delete flashcard. It has been restored.');
				return;
			}
			new Notice('Flashcard deleted.');
		});
		void EventBus.instance.publish(new FlashcardParserParseMetadataRequestEvent({ filepath }));
	}

	/**
	 * Drop cached previews only for files that changed identity (added, removed,
	 * renamed) or that no longer exist. Unchanged rows keep their previews so
	 * inline edits do not cause a full-page "Loading…" flash.
	 */
	private _dropStalePreviews(previous: FlashcardMetadata[], incoming: FlashcardMetadata[]): void {
		const previousByFile = new Map(previous.map((card) => [card.file, card.uuid] as const));
		const incomingByFile = new Map(incoming.map((card) => [card.file, card.uuid] as const));
		const stale = new Set<string>();
		for (const file of new Set([...previousByFile.keys(), ...incomingByFile.keys()])) {
			if (previousByFile.get(file) !== incomingByFile.get(file)) stale.add(file);
		}
		for (const file of Object.keys(manageStore.state.previews)) {
			if (!incomingByFile.has(file)) stale.add(file);
		}
		if (stale.size > 0) manageStore.clearPreviews(Array.from(stale));
	}
}
