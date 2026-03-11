import { IQueueItem } from "./IQueueItem";

export interface IQueue<Entity> {
  readonly queue: IQueueItem<Entity>[];

  enqueue: (item: IQueueItem<Entity>) => void;
  dequeue: () => IQueueItem<Entity> | undefined;
  peek: (index: number) => IQueueItem<Entity> | undefined;
  size: () => Number;
}
