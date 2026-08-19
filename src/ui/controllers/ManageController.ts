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
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardWriterFmResponseEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import { CardStatus } from '@/schemas';
import type { Flashcard, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import { buildCardPreview } from '@/ui/components/views/Manage/utils';
import { Notice } from 'obsidian';
import { manageStore } from '../store/manage.store';

type MetadataMutation = {
	before: Pick<FlashcardMetadata, 'status' | 'decks'>;
	expected: Partial<Pick<FlashcardMetadata, 'status' | 'decks'>>;
	label: 'Status' | 'Decks' | 'Card details';
};

export class ManageController {
	private _unsubscribers: Array<() => void> = [];
	private _pendingPreviews = new Map<string, () => void>();
	private _failedPreviews = new Set<string>();
	/** Pre-mutation card snapshots keyed by filepath, used to restore on failed deletes. */
	private _originals = new Map<string, FlashcardMetadata>();
	/** Pending on-disk metadata reconcilers keyed by filepath. */
	private _pendingReconcile = new Map<string, (result: ParseResult<FlashcardYaml>) => void>();
	/** Optimistic metadata writes, retained until the on-disk state confirms or rejects them. */
	private _pendingMetadataMutations = new Map<string, MetadataMutation>();

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
			EventBus.instance.subscribe(FlashcardWriterFmResponseEvent, async (event) => {
				this._reconcileMetadata(event.data.filepath);
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

	/** Optimistically update status and persist via frontmatter write. */
	updateStatus(card: FlashcardMetadata, status: CardStatus): void {
		this._rememberMetadataMutation(card, { status }, 'Status');
		this._patchLocally(card.file, { status });
		void EventBus.instance.publish(
			new FlashcardWriterFmRequestEvent({ filepath: card.file, fm: { status } }),
		);
	}

	/** Optimistically update decks and persist via frontmatter write. */
	updateDecks(card: FlashcardMetadata, decks: string[]): void {
		this._rememberMetadataMutation(card, { decks }, 'Decks');
		this._patchLocally(card.file, { decks });
		void EventBus.instance.publish(
			new FlashcardWriterFmRequestEvent({ filepath: card.file, fm: { decks } }),
		);
	}

	/** Optimistically remove the card and hard-delete its file. */
	deleteCard(card: FlashcardMetadata): void {
		if (!this._originals.has(card.file)) {
			this._originals.set(card.file, card);
		}
		manageStore.setFlashcards(manageStore.state.flashcards.filter((c) => c.uuid !== card.uuid));
		void EventBus.instance.publish(new FlashcardWriterDeleteRequestEvent({ uuid: card.uuid }));
	}

	dispose(): void {
		for (const unsub of this._unsubscribers) {
			unsub();
		}
		this._unsubscribers = [];
	}

	private _patchLocally(filepath: string, patch: Partial<FlashcardMetadata>): void {
		manageStore.setFlashcards(
			manageStore.state.flashcards.map((card) =>
				card.file === filepath ? { ...card, ...patch } : card,
			),
		);
	}

	private _rememberMetadataMutation(
		card: FlashcardMetadata,
		expected: MetadataMutation['expected'],
		label: Exclude<MetadataMutation['label'], 'Card details'>,
	): void {
		const pending = this._pendingMetadataMutations.get(card.file);
		this._pendingMetadataMutations.set(card.file, {
			before: pending?.before ?? { status: card.status, decks: card.decks },
			expected: { ...pending?.expected, ...expected },
			label: pending && pending.label !== label ? 'Card details' : label,
		});
	}

	private _matchesExpectedMetadata(
		yaml: FlashcardYaml,
		expected: MetadataMutation['expected'],
	): boolean {
		if (expected.status !== undefined && yaml.status !== expected.status) return false;
		if (
			expected.decks !== undefined &&
			(expected.decks.length !== yaml.decks.length ||
				expected.decks.some((deck, index) => deck !== yaml.decks[index]))
		) {
			return false;
		}
		return true;
	}

	/**
	 * Reconcile a file's frontmatter against the on-disk state after an inline
	 * Fm write completes. If the write failed, the parse returns the old values
	 * and the optimistic patch is reverted; if it succeeded, the new values are
	 * confirmed without waiting for the debounced index state event.
	 */
	private _reconcileMetadata(filepath: string): void {
		this._pendingReconcile.set(filepath, (result) => {
			const mutation = this._pendingMetadataMutations.get(filepath);
			this._pendingMetadataMutations.delete(filepath);

			if (!result.success || !result.entity) {
				if (mutation) {
					this._patchLocally(filepath, mutation.before);
					new Notice(
						`Couldn't save ${mutation.label.toLowerCase()}. Restored the last saved value.`,
					);
				}
				return;
			}

			this._applyMetadata(filepath, result.entity);
			if (!mutation) return;

			if (this._matchesExpectedMetadata(result.entity, mutation.expected)) {
				new Notice(`${mutation.label} saved.`);
				return;
			}

			new Notice(`Couldn't save ${mutation.label.toLowerCase()}. Restored the last saved value.`);
		});
		void EventBus.instance.publish(new FlashcardParserParseMetadataRequestEvent({ filepath }));
	}

	private _applyMetadata(filepath: string, yaml: FlashcardYaml): void {
		manageStore.setFlashcards(
			manageStore.state.flashcards.map((card) =>
				card.file === filepath ? { ...card, status: yaml.status, decks: yaml.decks } : card,
			),
		);
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
