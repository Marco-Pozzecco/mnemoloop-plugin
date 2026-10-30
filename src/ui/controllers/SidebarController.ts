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
import { FlashcardWriterUpdateResponseEvent } from '@/modules/events/domains/flashcard/writer';
import type { Flashcard, FlashcardMetadata } from '@/schemas';
import { buildCardPreview } from '@/ui/components/views/Manage/utils';
import { selectSidebarCards, sidebarStore, type SidebarActiveNote } from '../store/sidebar.store';

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

	dispose(): void {
		for (const unsub of this._unsubscribers) {
			unsub();
		}
		this._unsubscribers = [];
		if (this._activeLeafRef) {
			this._app.workspace.offref(this._activeLeafRef);
			this._activeLeafRef = null;
		}
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
		const cards = this._activeNote
			? selectSidebarCards(this._allCards, this._activeNote.path, (source, fromPath) =>
					this._resolveSourcePath(source, fromPath),
				)
			: [];
		sidebarStore.setCards(cards);
		this.ensurePreviews(cards);
	}
}
