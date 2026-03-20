import { IEngine } from "@/interfaces/IEngine";
import { IIndexer } from "@/interfaces/IIndexer";
import { IReviewQueue } from "@/interfaces/IReviewQueue";
import { IReviewItem } from "@/interfaces/IReviewItem";

export abstract class BaseReviewQueue<Entity> implements IReviewQueue<Entity> {
  protected _engine: IEngine<Entity>;
  protected _index: IIndexer<Entity>;
  protected _items: IReviewItem<Entity>[] = [];
  protected _position: number = 0;

  constructor(engine: IEngine<Entity>, indexer: IIndexer<Entity>) {
    this._engine = engine;
    this._index = indexer;
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
}
