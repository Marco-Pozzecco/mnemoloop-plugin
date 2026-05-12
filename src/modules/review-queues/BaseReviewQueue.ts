import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';
import { IReviewQueue } from '@/interfaces/IReviewQueue';

export abstract class BaseReviewQueue<
	Entity extends EntityYaml,
	EntityMetadata extends EntityYaml,
	EntityYaml,
> implements IReviewQueue<Entity> {
	protected _engine: IReviewEngine<EntityYaml>;
	protected _items: IReviewItem<Entity>[] = [];
	protected _position: number = 0;
	protected _itemsQuery?: (entity: EntityMetadata) => boolean;
	protected _deckFilter?: string;

	constructor(
		engine: IReviewEngine<EntityYaml>,
		query?: (entity: EntityMetadata) => boolean,
		deckFilter?: string,
	) {
		this._engine = engine;
		this._itemsQuery = query;
		this._deckFilter = deckFilter;
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
		this._position++;
		if (this._position >= this._items.length) {
			return null;
		}
		return this.current;
	}

	previous(): IReviewItem<Entity> | null {
		this._position--;
		if (this._position < 0) {
			this._position = 0;
			return null;
		}
		return this.current;
	}

	abstract dispose(): void;
}
