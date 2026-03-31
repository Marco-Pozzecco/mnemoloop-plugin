import { IIndexer } from '@/interfaces/IIndexer';
import { Flashcard } from '@/schemas';
import { EventType, QueueInitEvent } from '@/types/events';
import { EventBus } from '../event-bus/EventBus';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';
import { BaseReviewQueue } from './BaseReviewQueue';

export class FlashcardReviewQueue extends BaseReviewQueue<Flashcard> {
	constructor(index: IIndexer<Flashcard>, predicate?: (entity: Flashcard) => boolean) {
		const engine = new FsrsEngine();
		super(engine, index, predicate);
		let entities = [];

		if (predicate) {
			entities = this._index.query(predicate);
		} else {
			entities = this._index.getAll();
		}

		const sortedEntities = this._engine.sort(entities);
		this._items = sortedEntities.map((item) => new FlashcardReviewItem(item, item.file, engine));

		const event: QueueInitEvent = {
			event_type: EventType.QueueInit,
			created_at: new Date(),
			data: {
				due_today: this._items.length,
				total_cards: this._index.getAll().length,
			},
		};

		EventBus.instance.publish(event);
	}

	recalc(): void {
		let entities = [];

		if (this._itemsQuery) {
			entities = this._index.query(this._itemsQuery);
		} else {
			entities = this._index.getAll();
		}

		const sortedEntities = this._engine.sort(entities);
		this._items = sortedEntities.map(
			(item) => new FlashcardReviewItem(item, item.file, this._engine),
		);
		this._position = 0;
	}
}
