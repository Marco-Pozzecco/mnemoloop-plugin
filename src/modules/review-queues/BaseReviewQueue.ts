import { IIndexer } from '@/interfaces/IIndexer';
import { IParser } from '@/interfaces/IParser';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';
import { IReviewQueue } from '@/interfaces/IReviewQueue';

export abstract class BaseReviewQueue<
	Entity extends EntityMetadata,
	EntityMetadata,
> implements IReviewQueue<Entity> {
	protected _parser: IParser<Entity, EntityMetadata>;
	protected _engine: IReviewEngine<EntityMetadata>;
	protected _index: IIndexer<EntityMetadata>;
	protected _items: IReviewItem<Entity>[] = [];
	protected _position: number = 0;
	protected _itemsQuery?: (entity: EntityMetadata) => boolean;

	constructor(
		parser: IParser<Entity, EntityMetadata>,
		engine: IReviewEngine<EntityMetadata>,
		indexer: IIndexer<EntityMetadata>,
		query?: (entity: EntityMetadata) => boolean,
	) {
		this._parser = parser;
		this._engine = engine;
		this._index = indexer;
		this._itemsQuery = query;
	}

	get items(): IReviewItem<Entity>[] {
		return this._items;
	}

	get position(): number {
		return this._position;
	}

	get current(): IReviewItem<Entity> | null {
		return this._items[this._position];
	}

	get size(): number {
		return this._items.length;
	}

	next(): IReviewItem<Entity> | null {
		if (this._position >= this._items.length - 1) {
			return null;
		}
		this._position++;
		return this.current;
	}

	previous(): IReviewItem<Entity> | null {
		if (this._position <= 0) {
			return null;
		}
		this._position--;
		return this.current;
	}

	abstract recalc(): void;
}
