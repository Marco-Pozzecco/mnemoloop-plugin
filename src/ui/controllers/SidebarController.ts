import { getLinkpath } from 'obsidian';
import type { App, EventRef, TFile } from 'obsidian';
import { EventBus } from '@/modules/events/core';
import {
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
} from '@/modules/events/domains/flashcard/indexer';
import {
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
} from '@/modules/events/domains/flashcard/parsers';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import type { EventClass } from '@/interfaces/IEventRegistry';
import type { IEvent } from '@/interfaces/IEvent';
import type { CardStatus, Flashcard, FlashcardMetadata } from '@/schemas';
import { buildCardPreview } from '@/ui/components/views/Manage/utils';
import { selectSidebarCards, sidebarStore, type SidebarActiveNote } from '../store/sidebar.store';

interface WriteResponseData {
	filepath: string;
	requestId: string;
	success: boolean;
}

/**
 * Bridges the flashcard index and the workspace's active note to the sidebar
 * store. It keeps the whole index in memory and re-derives the note's linked
 * cards whenever the index or the active note changes; previews are fetched
 * lazily per listed card and cached by filepath.
 */
export class SidebarController {
	private _unsubscribers: Array<() => void> = [];
	private _activeLeafRef: EventRef | null = null;
	private _allCards: FlashcardMetadata[] = [];
	private _activeNote: SidebarActiveNote | null = null;
	private _pendingPreviews = new Set<string>();
	private _failedPreviews = new Set<string>();
	/** One parse attempt per filepath, shared by every click on that card. */
	private _pendingCardFetches = new Map<string, Promise<Flashcard | null>>();
	private _pendingCardUnsubs = new Set<() => void>();
	private _pendingWrites = new Set<() => void>();

	constructor(private _app: App) {
		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardIndexStateEvent, async (event) => {
				this._allCards = event.data.flashcards;
				// An index change can make a previously unparseable card readable.
				this._failedPreviews.clear();
				this._recompute();
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardWriterUpdateResponseEvent, async (event) => {
				if (!event.data.success) return;
				// The card's content changed, so its cached preview is stale. Drop it
				// and ask for a fresh parse; the row shows the new content without a
				// remount. This also covers edits made outside the panel (Manage, the
				// modal).
				sidebarStore.clearPreviews([event.data.filepath]);
				this.ensurePreviews(
					sidebarStore.state.cards.filter((card) => card.file === event.data.filepath),
				);
			}),
		);

		this._unsubscribers.push(
			EventBus.instance.subscribe(FlashcardParserParseResponseEvent, async (event) => {
				if (!this._pendingPreviews.has(event.data.filepath)) return;
				this._pendingPreviews.delete(event.data.filepath);
				if (event.data.success) {
					sidebarStore.setPreview(event.data.filepath, buildCardPreview(event.data.entity));
				} else {
					this._failedPreviews.add(event.data.filepath);
				}
			}),
		);

		this._readActiveNote();
		this._activeLeafRef = this._app.workspace.on('active-leaf-change', () =>
			this._readActiveNote(),
		);
	}

	async init(): Promise<void> {
		const unsub = EventBus.instance.subscribe(FlashcardIndexGetAllResponseEvent, async (event) => {
			this._allCards = event.data;
			sidebarStore.setLoading(false);
			this._recompute();
		});
		this._unsubscribers.push(unsub);

		await EventBus.instance.publish(new FlashcardIndexGetAllRequestEvent());
	}

	/**
	 * Request content previews for any listed card that does not already have one
	 * cached. Responses are correlated by filepath.
	 */
	ensurePreviews(cards: FlashcardMetadata[]): void {
		for (const card of cards) {
			if (sidebarStore.state.previews[card.file] !== undefined) continue;
			if (this._pendingPreviews.has(card.file)) continue;
			if (this._failedPreviews.has(card.file)) continue;
			this._pendingPreviews.add(card.file);
			void EventBus.instance.publish(new FlashcardParserParseRequestEvent({ filepath: card.file }));
		}
	}

	/** Fetch the full card (including content) for a filepath. */
	async fetchCard(filepath: string): Promise<Flashcard | null> {
		const existing = this._pendingCardFetches.get(filepath);
		if (existing) return existing;

		const promise = new Promise<Flashcard | null>((resolve) => {
			let settled = false;
			const finish = (card: Flashcard | null): void => {
				if (settled) return;
				settled = true;
				this._pendingCardUnsubs.delete(unsub);
				unsub();
				resolve(card);
			};

			const unsub = EventBus.instance.subscribe(
				FlashcardParserParseResponseEvent,
				async (event) => {
					if (event.data.filepath !== filepath) return;
					finish(event.data.success ? event.data.entity : null);
				},
			);
			this._pendingCardUnsubs.add(unsub);

			void EventBus.instance
				.publish(new FlashcardParserParseRequestEvent({ filepath }))
				.catch(() => finish(null));
		}).finally(() => {
			this._pendingCardFetches.delete(filepath);
		});

		this._pendingCardFetches.set(filepath, promise);
		return promise;
	}

	/** Create a card from the panel form. Resolves true when the writer confirms it. */
	async createCard(payload: {
		content: Flashcard['content'];
		decks: string[];
		source: string | null;
	}): Promise<boolean> {
		const request = new FlashcardWriterCreateRequestEvent(payload);
		return this._awaitWrite(request, FlashcardWriterCreateResponseEvent);
	}

	/** Update a card from the panel form. Resolves true when the writer confirms it. */
	async updateCard(
		card: Flashcard,
		payload: {
			content: Flashcard['content'];
			decks: string[];
			source: string | null;
			status?: CardStatus;
		},
	): Promise<boolean> {
		const request = new FlashcardWriterUpdateRequestEvent({
			uuid: card.uuid,
			content: payload.content,
			decks: payload.decks,
			source: payload.source,
			status: payload.status ?? card.status,
		} as Partial<Flashcard>);
		return this._awaitWrite(request, FlashcardWriterUpdateResponseEvent);
	}

	/** Delete a card from the panel. The index event confirms the removal. */
	deleteCard(card: FlashcardMetadata): void {
		this._allCards = this._allCards.filter((entry) => entry.uuid !== card.uuid);
		sidebarStore.clearPreviews([card.file]);
		this._recompute();
		void EventBus.instance.publish(new FlashcardWriterDeleteRequestEvent({ uuid: card.uuid }));
	}

	/** Abandon every write still waiting for its response. */
	cancelPendingWrites(): void {
		for (const cancel of [...this._pendingWrites]) cancel();
		this._pendingWrites.clear();
	}

	dispose(): void {
		this.cancelPendingWrites();
		for (const unsub of this._unsubscribers) {
			unsub();
		}
		this._unsubscribers = [];
		for (const unsub of this._pendingCardUnsubs) {
			unsub();
		}
		this._pendingCardUnsubs.clear();
		this._pendingCardFetches.clear();
		if (this._activeLeafRef) {
			this._app.workspace.offref(this._activeLeafRef);
			this._activeLeafRef = null;
		}
	}

	private _awaitWrite(
		request: IEvent<unknown>,
		responseClass: EventClass<WriteResponseData>,
	): Promise<boolean> {
		return new Promise((resolve) => {
			let settled = false;
			let unsubscribe: (() => void) | null = null;

			const finish = (success: boolean): void => {
				if (settled) return;
				settled = true;
				unsubscribe?.();
				this._pendingWrites.delete(cancel);
				resolve(success);
			};
			const cancel = (): void => finish(false);

			unsubscribe = EventBus.instance.subscribe(responseClass, async (response) => {
				if (response.data.requestId !== request.id) return;
				finish(response.data.success);
			});
			this._pendingWrites.add(cancel);

			void EventBus.instance.publish(request).catch(() => finish(false));
		});
	}

	/** Re-read the active file; a non-markdown or absent file is the "no note" state. */
	private _readActiveNote(): void {
		const file: TFile | null = this._app.workspace.getActiveFile();
		const note = file && file.extension === 'md' ? { path: file.path, name: file.basename } : null;
		this._activeNote = note;
		sidebarStore.setActiveNote(note);
		this._recompute();
	}

	/**
	 * Resolve a stored `[[wiki-link]]` source the way Obsidian resolves a click:
	 * by linkpath through the metadata cache, not by string equality. This keeps
	 * full-path, extensionless, basename-only, alias, heading and block links
	 * pointing at the same note.
	 */
	private _resolveSourcePath(source: string, fromPath: string): string | null {
		if (!source.startsWith('[[') || !source.endsWith(']]')) {
			return null;
		}
		const linkpath = getLinkpath(source.slice(2, -2));
		if (!linkpath) {
			return null;
		}
		return this._app.metadataCache.getFirstLinkpathDest(linkpath, fromPath)?.path ?? null;
	}

	private _recompute(): void {
		const deckOptions = Array.from(new Set(this._allCards.flatMap((card) => card.decks))).sort();
		sidebarStore.setDeckOptions(deckOptions);

		const cards = this._activeNote
			? selectSidebarCards(this._allCards, this._activeNote.path, (source, fromPath) =>
					this._resolveSourcePath(source, fromPath),
				)
			: [];
		sidebarStore.setCards(cards);
		this.ensurePreviews(cards);
	}
}
