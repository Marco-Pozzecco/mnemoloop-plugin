import { Flashcard } from '@/schemas';
import { BaseQueue } from './BaseQueue';
import { IIndexer } from '@/interfaces/IIndexer';
import { FsrsEngine } from '@/modules/engines/FsrsEngine';
import { FlashcardQueueItem } from '../queue-items/FlashcardQueueItem';
import { Queue } from '@/utils/Queue';

export class FlashcardQueue extends BaseQueue<Flashcard> {
  constructor(index: IIndexer<Flashcard>) {
    const engine = new FsrsEngine();
    super(engine, index);
    const entities = this._engine.sort(this._index.getAll());
    this._queue = new Queue(entities.map(item => new FlashcardQueueItem(item, engine)))
  }
}
