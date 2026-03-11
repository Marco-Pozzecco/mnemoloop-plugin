import { IEngine } from "@/interfaces/IEngine";
import { IIndexer } from "@/interfaces/IIndexer";
import { IQueue } from "@/interfaces/IQueue";
import { IQueueItem } from "@/interfaces/IQueueItem";
import { Queue } from "@/utils/Queue";

export abstract class BaseQueue<Entity> implements IQueue<Entity> {
  protected _engine: IEngine<Entity>;
  protected _index: IIndexer<Entity>;
  protected _queue: Queue<IQueueItem<Entity>> = new Queue([]);

  constructor(engine: IEngine<Entity>, indexer: IIndexer<Entity>) {
    this._engine = engine;
    this._index = indexer;
  }

  get queue() {
    return this._queue.toArray();
  };

  dequeue: () => IQueueItem<Entity> | undefined = () => {
    return this._queue.dequeue();
  };

  enqueue: (item: IQueueItem<Entity>) => void = (item) => {
    return this._queue.enqueue(item);
  };

  peek: (index: number) => IQueueItem<Entity> | undefined = (index = 0) => {
    return this._queue.peek(index);
  };

  size: () => Number = () => {
    return this._queue.size();
  };
}
