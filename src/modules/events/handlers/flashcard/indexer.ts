import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IndexKey } from '@/types/indexes';
import { ParserKey } from '@/types/parsers';
import { Logger } from '@/utils/Logger';
import { normalizePath } from 'obsidian';
import { EventBus } from '../../core/EventBus';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardIndexGetAllEvent,
	FlashcardIndexGetEvent,
	FlashcardIndexInitializeEvent,
	FlashcardIndexQueryEvent,
	FlashcardIndexRecalcEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexUpdateEvent,
	FlashcardStatisticsComputeEvent,
} from '../../domains/flashcard';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '../../domains/vault';

export class FlashcardIndexInitializeHandler extends EventHandler<FlashcardIndexInitializeEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexInitializeEvent): Promise<void> {
		try {
			const indexer = this._indexers.get(IndexKey.flashcard)!;
			await indexer.initialize();
		} catch (err) {
			Logger.error('Reindex failed', err);
		}
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexGetHandler extends EventHandler<FlashcardIndexGetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexGetEvent): Promise<void> {
		try {
			const indexer = this._indexers.get(IndexKey.flashcard)!;
			indexer.get(event.data.id);
		} catch (err) {
			Logger.error('Failed to get flashcard', err);
		}
	}
}

export class FlashcardIndexGetAllHandler extends EventHandler<FlashcardIndexGetAllEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexGetAllEvent): Promise<void> {
		try {
			const indexer = this._indexers.get(IndexKey.flashcard)!;
			indexer.getAll();
		} catch (err) {
			Logger.error('Failed to get all flashcards', err);
		}
	}
}

export class FlashcardIndexQueryHandler extends EventHandler<FlashcardIndexQueryEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexQueryEvent): Promise<void> {
		try {
			const indexer = this._indexers.get(IndexKey.flashcard)!;
			indexer.query(event.data.predicate);
		} catch (err) {
			Logger.error('Query failed', err);
		}
	}
}

export class FlashcardIndexUpdateHandler extends EventHandler<FlashcardIndexUpdateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardIndexUpdateEvent): Promise<void> {
		try {
			const indexer = this._indexers.get(IndexKey.flashcard)!;
			indexer.update(event.data.uuid!, event.data);
		} catch (err) {
			Logger.error('Failed to handle update request', err);
		}
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexSaveHandler extends EventHandler<FlashcardIndexSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexSaveEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		await indexer.save();
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexRecalcHandler extends EventHandler<FlashcardIndexRecalcEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardIndexRecalcEvent): Promise<void> {
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexCreateHandler extends EventHandler<VaultCreateEvent> {
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
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexDeleteHandler extends EventHandler<VaultDeleteEvent> {
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
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexModifyHandler extends EventHandler<VaultModifyEvent> {
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
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}

export class FlashcardIndexRenameHandler extends EventHandler<VaultRenameEvent> {
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
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}
