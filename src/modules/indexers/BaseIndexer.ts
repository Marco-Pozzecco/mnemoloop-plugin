import type { IAdapter } from '@/interfaces/IAdapter';
import { IIndexer } from '@/interfaces/IIndexer';
import { IParser } from '@/interfaces/IParser';
import { PluginSettings } from '@/schemas/settings';
import { IndexActions } from '@/types/indexes';
import { Cache } from '@/utils/Cache';

export abstract class BaseIndexer<
	Entity extends EntityYaml,
	EntityYaml,
	Index,
> implements IIndexer<Entity> {
	protected _cache: Cache<Entity> = new Cache();
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

	get index(): Record<string, Entity> {
		return this._cache.dump();
	}

	abstract initialize: () => Promise<void>;

	abstract save: () => Promise<void>;

	protected abstract eventHandler: (eventType: IndexActions) => void;

	get: (id: string) => Entity | undefined = (id) => {
		return this._cache.get(id);
	};

	getAll: () => Entity[] = () => {
		return this._cache.getAll();
	};

	query: (predicate: (entity: Entity) => boolean) => Entity[] = (predicate) => {
		return this._cache.query(predicate);
	};

	create: (id: string, data: Entity) => Entity = (id, data) => {
		this._cache.set(id, data);
		const entity = this._cache.get(id);
		if (!entity) {
			throw new Error(IndexError.FAILED_TO_CREATE);
		}

		this.eventHandler('create');

		return entity;
	};

	update: (id: string, data: Partial<Entity>) => Entity = (id, data) => {
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

		this.eventHandler('update');

		return result;
	};

	upsert: (id: string, data: Entity) => Entity = (id, data) => {
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

		this.eventHandler('delete');

		return this._cache.delete(id);
	};
}

enum IndexError {
	NOT_FOUND = 'entity not found in index',
	FAILED_TO_CREATE = 'failed to create entity in index',
	FAILED_TO_DELETE = 'failed to delete entity in index',
	FAILED_TO_UPDATE = 'failed to update entity in index',
}
