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
		this._bus.publish(new FlashcardStatisticsComputeEvent());
		this._bus.publish(
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
		this._bus.publish(new FlashcardIndexGetResponseEvent(response ?? null));
	}
}

export class FlashcardIndexGetAllHandler extends EventHandler<FlashcardIndexGetAllRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexGetAllRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.getAll();
		this._bus.publish(new FlashcardIndexGetAllResponseEvent(result));
	}
}

export class FlashcardIndexQueryHandler extends EventHandler<FlashcardIndexQueryRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexQueryRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.query(event.data.predicate);
		this._bus.publish(new FlashcardIndexQueryResponseEvent(result));
	}
}

export class FlashcardIndexUpdateHandler extends EventHandler<FlashcardIndexUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexUpdateRequestEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const result = indexer.update(event.data.uuid!, event.data);

		this._bus.publish(new FlashcardIndexUpdateResponseEvent(result));
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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

		this._bus.publish(new FlashcardIndexCreateResponseEvent(result));
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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

		this._bus.publish(new FlashcardIndexDeleteResponseEvent(result ?? null));
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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

		try {
			const parser = this._parsers.get(ParserKey.flashcard)!;
			const result = await parser.parseMetadata(data.path);
			const entity = indexer.generateMetadata(result);
			indexer.upsert(result.entity.uuid, entity);
			await indexer.save();
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.path}`, error);
		}
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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

		const existing = indexer.findByFilepath(data.path);
		const parser = this._parsers.get(ParserKey.flashcard)!;

		try {
			const result = await parser.parseMetadata(data.path);
			const entity = indexer.generateMetadata(result);
			indexer.update(entity.uuid, entity);
			await indexer.save();
		} catch {
			if (existing) {
				indexer.delete(existing.uuid);
				await indexer.save();
			}
		}
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
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
				const result = await parser.parseMetadata(data.path);
				const entity = indexer.generateMetadata(result);
				indexer.upsert(result.entity.uuid, entity);
				await indexer.save();
			}
		} catch (error) {
			Logger.error(`Watcher: failed to create flashcard from ${data.path} after rename`, error);
		}
		this._bus.publish(
			new FlashcardIndexStateEvent({ flashcards: indexer.getAll(), total: indexer.size }),
		);
		this._bus.publish(new FlashcardStatisticsComputeEvent());
	}
}
