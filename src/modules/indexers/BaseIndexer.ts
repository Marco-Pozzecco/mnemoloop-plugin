import type { IAdapter } from '@/interfaces/IAdapter';
import { IIndexer } from '@/interfaces/IIndexer';
import { IParser, ParseResult } from '@/interfaces/IParser';
import { PluginSettings } from '@/schemas/settings';
import { Cache } from '@/utils/Cache';

export abstract class BaseIndexer<
	Entity extends EntityYaml,
	EntityMetadata extends EntityYaml,
	EntityYaml,
	Index,
> implements IIndexer<EntityMetadata> {
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

	get size(): number {
		return this._cache.size();
	}

	abstract initialize: () => Promise<void>;

	abstract save: () => Promise<void>;

	get: (id: string) => EntityMetadata | undefined = (id) => {
		return this._cache.get(id);
	};

	getAll: () => EntityMetadata[] = () => {
		return this._cache.getAll();
	};

	query: (predicate: (entity: EntityMetadata) => boolean) => EntityMetadata[] = (predicate) => {
		return this._cache.query(predicate);
	};

	create: (id: string, data: EntityMetadata) => EntityMetadata = (id, data) => {
		this._cache.set(id, data);
		const entity = this._cache.get(id);
		if (!entity) {
			throw new Error(IndexError.FAILED_TO_CREATE);
		}
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

		return result;
	};

	upsert: (
		id: string,
		data: EntityMetadata,
	) => { result: EntityMetadata; operation: 'create' | 'update' } = (id, data) => {
		const entity = this._cache.get(id);

		if (entity) {
			return { result: this.update(id, data), operation: 'update' };
		} else {
			return { result: this.create(id, data), operation: 'create' };
		}
	};

	delete: (id: string) => EntityMetadata | undefined = (id) => {
		const entity = this._cache.get(id);
		if (!entity) throw new Error(IndexError.NOT_FOUND);
		this._cache.delete(id);
		return entity;
	};

	public abstract generateMetadata(data: ParseResult<Entity>): EntityMetadata;
}

enum IndexError {
	NOT_FOUND = 'Entity not found in index',
	FAILED_TO_UPDATE = 'Failed to update entity',
	FAILED_TO_CREATE = 'Failed to create entity',
}
