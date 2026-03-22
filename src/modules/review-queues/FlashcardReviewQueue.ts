import { Flashcard } from '@/schemas';
import { IIndexer } from '@/interfaces/IIndexer';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { Plugin } from 'obsidian';
import { BaseReviewQueue } from './BaseReviewQueue';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';

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
