import type { IAdapter } from '@/interfaces/IAdapter';
import { IIndexer } from '@/interfaces/IIndexer';
import { IParser, ParseResult } from '@/interfaces/IParser';
import { PluginSettings } from '@/schemas/settings';
import { Cache } from '@/utils/Cache';
import { IndexAction } from '../events';
import { IEventEmitter } from '@/interfaces/IEventEmitter';

export abstract class BaseIndexer<
	Entity extends EntityYaml,
	EntityMetadata extends EntityYaml,
	EntityYaml,
	Index,
>
	implements IIndexer<EntityMetadata>, IEventEmitter<IndexAction>
{
	protected _cache: Cache<EntityMetadata> = new Cache();
	protected _parser: IParser<Entity, EntityYaml>;
	protected _settings: IAdapter<PluginSettings>;
	protected _adapter: IAdapter<Index>;

	constructor(
		parser: IParser<Entity, EntityYaml>,
		settings: IAdapter<PluginSettings>,
		adapter: IAdapter<Index>,
	) {
		this._parser = parser;
		this._settings = settings;
		this._adapter = adapter;
	}

	get index(): Record<string, EntityMetadata> {
		return this._cache.dump();
	}

	abstract initialize: () => Promise<void>;

	abstract save: () => Promise<void>;

	abstract emit: (action: IndexAction, data?: unknown) => void;

	get: (id: string) => EntityMetadata | undefined = (id) => {
		const result = this._cache.get(id);
		this.emit(IndexAction.Get, result);
		return result;
	};

	getAll: () => EntityMetadata[] = () => {
		const result = this._cache.getAll();
		this.emit(IndexAction.GetAll, result);
		return result;
	};

	query: (predicate: (entity: EntityMetadata) => boolean) => EntityMetadata[] = (predicate) => {
		const result = this._cache.query(predicate);
		this.emit(IndexAction.Query, result);
		return result;
	};

	create: (id: string, data: EntityMetadata) => EntityMetadata = (id, data) => {
		this._cache.set(id, data);
		const entity = this._cache.get(id);
		if (!entity) {
			throw new Error(IndexError.FAILED_TO_CREATE);
		}

		this.emit(IndexAction.Create, entity);

		return entity;
	};

	update: (id: string, data: Partial<EntityMetadata>) => EntityMetadata = (id, data) => {
		const entity = this._cache.get(id);

		if (!entity) {
			throw new Error(IndexError.NOT_FOUND);
		}

		const updatedEntity = {
			...entity,
			...data,
		};

		this._cache.set(id, updatedEntity);

		const result = this._cache.get(id);

		if (!result) {
			throw new Error(IndexError.FAILED_TO_UPDATE);
		}

		this.emit(IndexAction.Update, result);

		return result;
	};

	upsert: (id: string, data: EntityMetadata) => EntityMetadata = (id, data) => {
		const entity = this._cache.get(id);

		if (entity) {
			return this.update(id, data);
		} else {
			return this.create(id, data);
		}
	};

	delete: (id: string) => void = (id) => {
		const entity = this._cache.get(id);
		if (!entity) throw new Error(IndexError.NOT_FOUND);

		this.emit(IndexAction.Delete, entity);

		return this._cache.delete(id);
	};

	protected abstract _generateMetadata: (data: ParseResult<Entity>) => EntityMetadata;
}

enum IndexError {
	NOT_FOUND = 'entity not found in index',
	FAILED_TO_CREATE = 'failed to create entity in index',
	FAILED_TO_DELETE = 'failed to delete entity in index',
	FAILED_TO_UPDATE = 'failed to update entity in index',
}
