import { IAdapter } from '@/interfaces/IAdapter';
import { ParseResult } from '@/interfaces/IParser';
import {
	Flashcard,
	FlashcardIndex,
	FlashcardMetadata,
	FlashcardMetadataSchema,
	FlashcardYaml,
} from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { EventData, EventType, ReviewFlashcardEvent } from '@/types/events';
import { IndexActions, IndexEventType, IndexFlashcardEvents } from '@/types/indexes';
import {
	WatcherEventType,
	WatcherFlashcardCreateEvent,
	WatcherFlashcardDeleteEvent,
	WatcherFlashcardModifyEvent,
	WatcherFlashcardRenameEvent,
} from '@/types/watcher';
import { Logger } from '@/utils/Logger';
import { normalizePath } from 'obsidian';
import { FlashcardAdapter } from '../adapters/FlashcardAdapter';
import { EventBus } from '../event-bus/EventBus';
import { FlashcardParser } from '../parsers/FlashcardParser';
import { BaseIndexer } from './BaseIndexer';

export class FlascardIndexer extends BaseIndexer<
	Flashcard,
	FlashcardMetadata,
	FlashcardYaml,
	FlashcardIndex
> {
	private _dirPath = this._settings.data.flashcard.watch.directory;

	constructor(
		parser: FlashcardParser,
		adapter: FlashcardAdapter,
		settings: IAdapter<PluginSettings>,
	) {
		super(parser, settings, adapter);

		EventBus.instance.subscribe((event) => {
			if (event.event_type === EventType.ReviewFlashcard) {
				const card = (event as ReviewFlashcardEvent).data;
				const cardUUID = card.uuid;
				this.update(cardUUID, card);
			}
		});

		// Subscribe to watcher events
		EventBus.instance.subscribe((event) => {
			switch (event.event_type) {
				case WatcherEventType.WatcherFlashcardFileCreate:
					this._handleWatcherCreate((event as WatcherFlashcardCreateEvent).data);
					break;
				case WatcherEventType.WatcherFlashcardFileModify:
					this._handleWatcherModify((event as WatcherFlashcardModifyEvent).data);
					break;
				case WatcherEventType.WatcherFlashcardFileDelete:
					this._handleWatcherDelete((event as WatcherFlashcardDeleteEvent).data);
					break;
				case WatcherEventType.WatcherFlashcardFileRename:
					this._handleWatcherRename((event as WatcherFlashcardRenameEvent).data);
					break;
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
		const flashcards = await this._parser.parseAll(this._dirPath);

		for (const flashcard of flashcards) {
			const metadata = this._generateMetadata(flashcard);
			this.upsert(flashcard.entity.uuid, metadata);
		}
	};

	private _findByFilepath(
		filepath: string,
	): { uuid: string; entity: FlashcardMetadata } | undefined {
		const normalizedPath = normalizePath(filepath);
		const entities = this.query((e) => e.file === normalizedPath);

		if (entities.length === 0) {
			return undefined;
		}

		const entity = entities[0];
		return { entity, uuid: entity.uuid };
	}

	private async _handleWatcherCreate(data: { filepath: string }): Promise<void> {
		Logger.debug(`Watcher: handling create for ${data.filepath}`);

		if (!this._isPathInWatchedDir(data.filepath)) {
			return;
		}

		try {
			const result = await this._parser.parseMetadata(data.filepath);

			const entity = this._generateMetadata(result);
			this.upsert(result.entity.uuid, entity);

			await this.save();
			Logger.info(`Watcher: created flashcard ${result.entity.uuid} from ${data.filepath}`);
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.filepath}`, error);
		}
	}

	private async _handleWatcherModify(data: { filepath: string }): Promise<void> {
		Logger.debug(`Watcher: handling modify for ${data.filepath}`);

		if (!this._isPathInWatchedDir(data.filepath)) {
			return;
		}

		const existing = this._findByFilepath(data.filepath);

		try {
			const result = await this._parser.parseMetadata(data.filepath);
			const entity = this._generateMetadata(result);
			this.upsert(result.entity.uuid, entity);
			Logger.info(`Watcher: updated flashcard ${result.entity.uuid} from ${data.filepath}`);
		} catch (error) {
			if (existing) {
				this.delete(existing.uuid);
				Logger.info(`Watcher: deleted flashcard ${existing.uuid} due to parse error`);
			}
		}

		await this.save();
	}

	private async _handleWatcherDelete(data: { filepath: string }): Promise<void> {
		Logger.debug(`Watcher: handling delete for ${data.filepath}`);

		if (!this._isPathInWatchedDir(data.filepath)) {
			return;
		}

		const existing = this._findByFilepath(data.filepath);
		if (existing) {
			this.delete(existing.uuid);
			await this.save();
			Logger.info(`Watcher: deleted flashcard ${existing.uuid} from ${data.filepath}`);
		}
	}

	private async _handleWatcherRename(data: { filepath: string; oldPath: string }): Promise<void> {
		Logger.debug(`Watcher: handling rename from ${data.oldPath} to ${data.filepath}`);

		const oldNormalized = normalizePath(data.oldPath);
		const newNormalized = normalizePath(data.filepath);

		// Find flashcard by old path
		const existing = this._findByFilepath(oldNormalized);

		if (existing) {
			// Update file path
			const updatedEntity = { ...existing.entity, file: newNormalized };
			this.upsert(existing.uuid, updatedEntity);
			await this.save();
			Logger.info(
				`Watcher: renamed flashcard ${existing.uuid} from ${data.oldPath} to ${data.filepath}`,
			);
		} else if (this._isPathInWatchedDir(data.filepath)) {
			// Not found in old path but new path is in watched dir, treat as create
			await this._handleWatcherCreate({ filepath: data.filepath });
		}
	}

	private _isPathInWatchedDir(filepath: string): boolean {
		const normalizedPath = normalizePath(filepath);
		const normalizedDir = normalizePath(this._dirPath);
		return normalizedPath.startsWith(normalizedDir + '/') || normalizedPath === normalizedDir;
	}

	protected _generateMetadata = (data: ParseResult<FlashcardYaml>): FlashcardMetadata => {
		let metadata: FlashcardMetadata = {
			...data.entity,
			file: data.filepath,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null,
		};
		const existing = this._findByFilepath(data.filepath);
		if (existing) {
			metadata.created_at = existing.entity.created_at;
			metadata.updated_at = existing.entity.updated_at;
			metadata.deleted_at = existing.entity.deleted_at;
		}

		return FlashcardMetadataSchema.parse(metadata);
	};
}
