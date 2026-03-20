import { Flashcard } from '@/schemas';
import { BaseReviewQueue } from './BaseReviewQueue';
import { IIndexer } from '@/interfaces/IIndexer';
import { FsrsEngine } from '@/modules/engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { Plugin } from 'obsidian';

export class FlashcardReviewQueue extends BaseReviewQueue<Flashcard> {
  constructor(plugin: Plugin, index: IIndexer<Flashcard>, predicate?: (entity: Flashcard) => boolean) {
    const engine = new FsrsEngine();
    super(engine, index);
    let entities = [];

    if (predicate) {
      entities = this._index.query(predicate);
    } else {
      entities = this._index.getAll();
    }

    const sortedEntities = this._engine.sort(entities);
    this._items = sortedEntities.map(item => new FlashcardReviewItem(item, item.file, engine, [new FlashcardYamlEngine(plugin)]));
  }
}
