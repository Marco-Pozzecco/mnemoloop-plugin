export class Queue<T> {
  private _items: T[];

  constructor(items: T[]) {
    this._items = items;
  }

  enqueue(item: T): void {
    this._items.push(item);
  }

  dequeue(): T | undefined {
    return this._items.shift();
  }

  peek(index: number = 0): T | undefined {
    return this._items[index];
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  size(): number {
    return this._items.length;
  }

  clear(): void {
    this._items = [];
  }

  toArray(): T[] {
    return [...this._items];
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this._items;

    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined, done: true } as IteratorResult<T>;
      },
    };
  }
}
