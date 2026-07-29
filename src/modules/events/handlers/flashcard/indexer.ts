import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IndexKey } from '@/types/indexes';
import { ParserKey } from '@/types/parsers';
import { Logger } from '@/utils/Logger';
import { normalizePath } from 'obsidian';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardIndexCreateRequestEvent,
	FlashcardIndexCreateResponseEvent,
	FlashcardIndexDeleteRequestEvent,
	FlashcardIndexDeleteResponseEvent,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexGetRequestEvent,
	FlashcardIndexGetResponseEvent,
	FlashcardIndexInitEvent,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexStateEvent,
	FlashcardIndexUpdateRequestEvent,
	FlashcardIndexUpdateResponseEvent,
	FlashcardStatisticsComputeEvent,
} from '../../domains/flashcard';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '../../domains/vault';

export class FlashcardIndexInitializeHandler extends EventHandler<FlashcardIndexInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexInitEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		await indexer.initialize();
		// Update statistics
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
	}
}

export class FlashcardIndexSaveHandler extends EventHandler<FlashcardIndexSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexSaveEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		await indexer.save();
	}
}

export class FlashcardIndexGetHandler extends EventHandler<FlashcardIndexGetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexGetRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const response = indexer.get(event.data.id);
		void this._bus.publish(new FlashcardIndexGetResponseEvent(response ?? null));
	}
}

export class FlashcardIndexGetAllHandler extends EventHandler<FlashcardIndexGetAllRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexGetAllRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.getAll();
		void this._bus.publish(new FlashcardIndexGetAllResponseEvent(result));
	}
}

export class FlashcardIndexQueryHandler extends EventHandler<FlashcardIndexQueryRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexQueryRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.query(event.data.predicate);
		void this._bus.publish(new FlashcardIndexQueryResponseEvent(result));
	}
}

export class FlashcardIndexUpdateHandler extends EventHandler<FlashcardIndexUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexUpdateRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.update(event.data.uuid!, event.data);

		void this._bus.publish(new FlashcardIndexUpdateResponseEvent(result));
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexCreateHandler extends EventHandler<FlashcardIndexCreateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexCreateRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.create(event.data.uuid, event.data);
		await indexer.save();

		void this._bus.publish(new FlashcardIndexCreateResponseEvent(result));
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexDeleteHandler extends EventHandler<FlashcardIndexDeleteRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexDeleteRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.delete(event.data.uuid);
		await indexer.save();

		void this._bus.publish(new FlashcardIndexDeleteResponseEvent(result ?? null));
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

// Vault events
export class FlashcardIndexOnVaultCreateHandler extends EventHandler<VaultCreateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: VaultCreateEvent): Promise<void> {
		const data = event.data;

		if (data.entity !== 'flashcard') {
			return;
		}

		const indexer = this._indexers.get(IndexKey.flashcard)!;
		if (!indexer.isPathInWatchedDir(data.path)) {
			return;
		}

		const file = this._plugin.app.vault.getFileByPath(data.path);

		if (!file) {
			return;
		}

		try {
			const parser = this._parsers.get(ParserKey.flashcard)!;
			const rawResult = await parser.parseYaml(data.path);
			if (Array.isArray(rawResult)) {
				Logger.error('parseMetadata returned array for filepath, expected single result');
				return;
			}
			if (rawResult.success) {
				const entity = indexer.generateMetadata(rawResult.entity, rawResult.filepath, {
					created_at: new Date(file.stat.ctime).toISOString(),
					updated_at: new Date(file.stat.mtime).toISOString(),
				});
				indexer.upsert(entity.uuid, entity);
				await indexer.save();
			}
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.path}`, error);
		}
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexOnVaultDeleteHandler extends EventHandler<VaultDeleteEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: VaultDeleteEvent): Promise<void> {
		const data = event.data;

		if (data.entity !== 'flashcard') {
			return;
		}

		const indexer = this._indexers.get(IndexKey.flashcard)!;
		if (!indexer.isPathInWatchedDir(data.path)) {
			return;
		}

		const existing = indexer.findByFilepath(data.path);
		if (existing) {
			indexer.delete(existing.uuid);
			await indexer.save();
		}
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexOnVaultModifyHandler extends EventHandler<VaultModifyEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: VaultModifyEvent): Promise<void> {
		const data = event.data;

		if (data.entity !== 'flashcard') {
			return;
		}

		const indexer = this._indexers.get(IndexKey.flashcard)!;
		if (!indexer.isPathInWatchedDir(data.path)) {
			return;
		}

		const file = this._plugin.app.vault.getFileByPath(data.path);

		if (!file) {
			return;
		}

		const existing = indexer.findByFilepath(data.path);

		const parser = this._parsers.get(ParserKey.flashcard)!;

		try {
			const rawResult = await parser.parseYaml(data.path);
			if (Array.isArray(rawResult)) return;
			Logger.info('flashcard modify data:', rawResult);
			const result = rawResult;
			if (result.success) {
				const entity = indexer.generateMetadata(result.entity, result.filepath, {
					created_at: new Date(file.stat.ctime).toISOString(),
					updated_at: new Date(file.stat.mtime).toISOString(),
				});
				indexer.update(entity.uuid, entity);
				await indexer.save();
			}
		} catch {
			if (existing) {
				indexer.delete(existing.uuid);
				await indexer.save();
			}
		}
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexOnVaultRenameHandler extends EventHandler<VaultRenameEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: VaultRenameEvent): Promise<void> {
		const data = event.data;

		if (data.entity !== 'flashcard') {
			return;
		}

		const file = this._plugin.app.vault.getFileByPath(data.path);

		if (!file) {
			return;
		}

		const oldNormalized = normalizePath(data.oldPath);
		const newNormalized = normalizePath(data.path);
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const existing = indexer.findByFilepath(oldNormalized);

		try {
			if (existing) {
				const updatedEntity = { ...existing.entity, file: newNormalized };
				indexer.upsert(existing.uuid, updatedEntity);
				await indexer.save();
			} else if (indexer.isPathInWatchedDir(data.path)) {
				const parser = this._parsers.get(ParserKey.flashcard)!;
				const rawResult = await parser.parseYaml(data.path);
				if (Array.isArray(rawResult)) return;
				const result = rawResult;
				if (result.success) {
					const entity = indexer.generateMetadata(result.entity, result.filepath, {
						created_at: new Date(file.stat.ctime).toISOString(),
						updated_at: new Date(file.stat.mtime).toISOString(),
					});
					indexer.upsert(entity.uuid, entity);
					await indexer.save();
				}
			}
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.path} after rename`, error);
		}
		void this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		void this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}
