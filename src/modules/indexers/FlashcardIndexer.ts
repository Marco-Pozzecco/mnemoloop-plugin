import { IAdapter } from '@/interfaces/IAdapter';
import { Flashcard, FlashcardIndex, FlashcardMetadata } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { EventData, EventType, ReviewFlashcardEvent } from '@/types/events';
import { IndexActions, IndexEventType, IndexFlashcardEvents } from '@/types/indexes';
import { Plugin } from 'obsidian';
import { FlashcardAdapter } from '../adapters/FlashcardAdapter';
import { EventBus } from '../event-bus/EventBus';
import { FlashcardParser } from '../parsers/FlashcardParser';
import { BaseIndexer } from './BaseIndexer';

export class FlascardIndexer extends BaseIndexer<Flashcard, FlashcardMetadata, FlashcardIndex> {
	private _dirPath = this._settings.data.flashcardsDirectory;

	constructor(plugin: Plugin, settings: IAdapter<PluginSettings>) {
		const parser = new FlashcardParser(plugin, settings);
		const adapter = new FlashcardAdapter(plugin);
		super(parser, settings, adapter);

		EventBus.instance.subscribe((event) => {
			if (event.event_type === EventType.ReviewFlashcard) {
				const card = (event as ReviewFlashcardEvent).data;
				const cardUUID = card.uuid;
				this.update(cardUUID, card);
			}
		});
	}

	protected eventHandler: (eventType: IndexActions) => void = (eventType) => {
		let event: EventData<unknown> = {
			created_at: new Date(),
			data: null,
			event_type: IndexEventType.IndexFlashcardInitialize,
		};

		switch (eventType) {
			case 'create':
				event.event_type = IndexEventType.IndexFlashcardCreate;
				event.data = {
					flashcards: this._cache.getAll(),
					total: this._cache.size(),
				} satisfies IndexFlashcardEvents['create']['data'];
				break;
			case 'update':
				event.event_type = IndexEventType.IndexFlashcardUpdate;
				event.data = {
					flashcards: this._cache.getAll(),
					total: this._cache.size(),
				} satisfies IndexFlashcardEvents['update']['data'];
				break;
			case 'delete':
				event.event_type = IndexEventType.IndexFlashcardDelete;
				event.data = {
					flashcards: this._cache.getAll(),
					total: this._cache.size(),
				} satisfies IndexFlashcardEvents['delete']['data'];
				break;
			case 'initialize':
				event.event_type = IndexEventType.IndexFlashcardInitialize;
				event.data = {
					flashcards: this._cache.getAll(),
					total: this._cache.size(),
				} satisfies IndexFlashcardEvents['initialize']['data'];
				break;
			case 'save':
				event.event_type = IndexEventType.IndexFlashcardSave;
				event.data = {
					flashcards: this._cache.getAll(),
					total: this._cache.size(),
					saved_at: new Date(),
				} satisfies IndexFlashcardEvents['save']['data'];
				break;
		}

		EventBus.instance.publish(event);
	};

	initialize: () => Promise<void> = async () => {
		await this._adapter.initialize();

		const { flashcards } = this._adapter.data;

		if (flashcards.length === 0) {
			await this.reindex();
		} else {
			for (const flashcard of flashcards) {
				this._cache.set(flashcard.uuid, flashcard);
			}
		}

		await this.save();
		this.eventHandler('initialize');
	};

	save: () => Promise<void> = async () => {
		const flashcards = Object.values(this._cache.dump());

		this._adapter.set({
			flashcards,
			updated_at: new Date().toISOString(),
		});

		await this._adapter.save();
		this.eventHandler('save');
	};

	reindex: () => Promise<void> = async () => {
		const flashcards = await this._parser.parseAll(this._dirPath, false);

		for (const flashcard of flashcards) {
			if (!flashcard.entity) {
				continue;
			}
			this.upsert(flashcard.entity.uuid, flashcard.entity);
		}
	};
}
