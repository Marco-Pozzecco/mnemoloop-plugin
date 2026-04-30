import { IAdapter } from '@/interfaces/IAdapter';
import { IEvent } from '@/interfaces/IEvent';
import { ParseResult } from '@/interfaces/IParser';
import {
	Flashcard,
	FlashcardIndex,
	FlashcardMetadata,
	FlashcardMetadataSchema,
	FlashcardYaml,
} from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { Logger } from '@/utils/Logger';
import { normalizePath } from 'obsidian';
import { FlashcardAdapter } from '../adapters/FlashcardAdapter';
import {
	EventBus,
	FileWatcherCreateData,
	FileWatcherDeleteData,
	FileWatcherModifyData,
	FileWatcherRenameData,
	FlashcardIndexCreateEvent,
	FlashcardIndexCreateEventData,
	FlashcardIndexDeleteEvent,
	FlashcardIndexDeleteEventData,
	FlashcardIndexEventData,
	FlashcardIndexInitializeEvent,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
	FlashcardIndexQueryResponseEventData,
	FlashcardIndexRecalcRequestEvent,
	FlashcardIndexRecalcResponseEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexUpdateEvent,
	FlashcardIndexUpdateEventData,
	FlashcardReviewSessionScoreEvent,
	FlashcardWatcherCreateEvent,
	FlashcardWatcherDeleteEvent,
	FlashcardWatcherModifyEvent,
	FlashcardWatcherRenameEvent,
	IndexAction,
} from '../events';
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
			if (event.isType(FlashcardReviewSessionScoreEvent.type)) {
				const card = (event as FlashcardReviewSessionScoreEvent).data;
				const cardUUID = card.uuid;
				this.update(cardUUID, card);
			} else if (event.isType(FlashcardIndexRecalcRequestEvent.type)) {
				this.emit(IndexAction.Recalc);
			} else if (event.isType(FlashcardIndexQueryRequestEvent.type)) {
				const data = (event as FlashcardIndexQueryRequestEvent).data;
				this.query(data.predicate);
			} else if (event.isType(FlashcardWatcherCreateEvent.type)) {
				this._handleWatcherCreate((event as FlashcardWatcherCreateEvent).data);
			} else if (event.isType(FlashcardWatcherModifyEvent.type)) {
				this._handleWatcherModify((event as FlashcardWatcherModifyEvent).data);
			} else if (event.isType(FlashcardWatcherDeleteEvent.type)) {
				this._handleWatcherDelete((event as FlashcardWatcherDeleteEvent).data);
			} else if (event.isType(FlashcardWatcherRenameEvent.type)) {
				this._handleWatcherRename((event as FlashcardWatcherRenameEvent).data);
			}
		});
	}

	emit: (action: IndexAction, data?: unknown) => void = (action, data) => {
		let event: IEvent | null = null;

		if (action === IndexAction.Create) {
			event = new FlashcardIndexCreateEvent(data as FlashcardIndexCreateEventData);
		} else if (action === IndexAction.Update) {
			event = new FlashcardIndexUpdateEvent(data as FlashcardIndexUpdateEventData);
		} else if (action === IndexAction.Delete) {
			event = new FlashcardIndexDeleteEvent(data as FlashcardIndexDeleteEventData);
		} else if (action === IndexAction.Recalc) {
			const data = { flashcards: this._cache.getAll(), total: this._cache.size() };
			event = new FlashcardIndexRecalcResponseEvent(data);
		} else if (action === IndexAction.Save) {
			event = new FlashcardIndexSaveEvent(data as FlashcardIndexEventData);
		} else if (action === IndexAction.Initialize) {
			event = new FlashcardIndexInitializeEvent(data as FlashcardIndexEventData);
		} else if (action === IndexAction.Query) {
			event = new FlashcardIndexQueryResponseEvent(data as FlashcardIndexQueryResponseEventData);
		}

		if (event) {
			EventBus.instance.publish(event);
		}
	};

	initialize: () => Promise<void> = async () => {
		await this._adapter.initialize();

		const entries = this._adapter.data.flashcards.reduce(
			(acc, flashcard) => ({ ...acc, [flashcard.uuid]: flashcard }),
			{} as Record<string, FlashcardMetadata>,
		);
		this._cache.load(entries);

		const flashcards = await this._parser.parseAll(this._dirPath);

		for (const flashcard of flashcards) {
			const metadata = this._generateMetadata(flashcard);
			this._cache.set(flashcard.entity.uuid, metadata);
		}

		await this.save();

		const data: FlashcardIndexEventData = {
			flashcards: Object.values(this._cache.dump()),
			total: this._cache.size(),
		};
		this.emit(IndexAction.Initialize, data);
	};

	save: () => Promise<void> = async () => {
		const flashcards = Object.values(this._cache.dump());

		this._adapter.set({
			flashcards,
			updated_at: new Date().toISOString(),
		});

		await this._adapter.save();

		const data: FlashcardIndexEventData = {
			flashcards: Object.values(this._cache.dump()),
			total: this._cache.size(),
		};
		this.emit(IndexAction.Save, data);
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

	private async _handleWatcherCreate(data: FileWatcherCreateData): Promise<void> {
		if (!this._isPathInWatchedDir(data.path)) {
			return;
		}

		try {
			const result = await this._parser.parseMetadata(data.path);

			const entity = this._generateMetadata(result);
			this.upsert(result.entity.uuid, entity);

			await this.save();
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.path}`, error);
		}
	}

	private async _handleWatcherModify(data: FileWatcherModifyData): Promise<void> {
		if (!this._isPathInWatchedDir(data.path)) {
			return;
		}

		const existing = this._findByFilepath(data.path);

		try {
			const result = await this._parser.parseMetadata(data.path);
			const entity = this._generateMetadata(result);
			this.update(entity.uuid, entity);
		} catch {
			if (existing) {
				this.delete(existing.uuid);
			}
		}

		await this.save();
	}

	private async _handleWatcherDelete(data: FileWatcherDeleteData): Promise<void> {
		if (!this._isPathInWatchedDir(data.path)) {
			return;
		}

		const existing = this._findByFilepath(data.path);
		if (existing) {
			this.delete(existing.uuid);
			await this.save();
		}
	}

	private async _handleWatcherRename(data: FileWatcherRenameData): Promise<void> {
		const oldNormalized = normalizePath(data.oldPath);
		const newNormalized = normalizePath(data.path);

		// Find flashcard by old path
		const existing = this._findByFilepath(oldNormalized);

		if (existing) {
			// Update file path
			const updatedEntity = { ...existing.entity, file: newNormalized };
			this.upsert(existing.uuid, updatedEntity);
			await this.save();
			Logger.info(
				`Watcher: renamed flashcard ${existing.uuid} from ${data.oldPath} to ${data.path}`,
			);
		} else if (this._isPathInWatchedDir(data.path)) {
			// Not found in old path but new path is in watched dir, treat as create
			await this._handleWatcherCreate({
				path: data.path,
			});
		}
	}

	private _isPathInWatchedDir(filepath: string): boolean {
		const normalizedPath = normalizePath(filepath);
		const normalizedDir = normalizePath(this._dirPath);
		return normalizedPath.startsWith(normalizedDir + '/') || normalizedPath === normalizedDir;
	}

	protected _generateMetadata = (data: ParseResult<FlashcardYaml>): FlashcardMetadata => {
		const metadata: FlashcardMetadata = {
			...data.entity,
			file: data.filepath,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null,
		};

		const existing = this.query((flashcard) => flashcard.uuid === data.entity.uuid)?.[0];
		if (existing) {
			metadata.uuid = existing.uuid;
			metadata.created_at = existing.created_at;
			metadata.updated_at = existing.updated_at;
			metadata.deleted_at = existing.deleted_at;
		}

		return FlashcardMetadataSchema.parse(metadata);
	};
}
