import { Flashcard, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '../events';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';
import { BaseReviewQueue } from './BaseReviewQueue';

export class FlashcardReviewQueue extends BaseReviewQueue<
	Flashcard,
	FlashcardMetadata,
	FlashcardYaml
> {
	constructor(predicate?: (entity: FlashcardMetadata) => boolean) {
		const engine = new FsrsEngine();
		super(engine, predicate);

		EventBus.instance.subscribe((event) => {
			if (event.isType(FlashcardIndexQueryResponseEvent.type)) {
				const data = (event as FlashcardIndexQueryResponseEvent).data;
				const sortedData = this._engine.sort(data.flashcards);
				this._items = sortedData.map((f) => new FlashcardReviewItem(f.file, engine));
			}
		});

		EventBus.instance.publish(
			new FlashcardIndexQueryRequestEvent({
				predicate: predicate ?? (() => false),
			}),
		);
	}

	recalc(): void {
		EventBus.instance.publish(
			new FlashcardIndexQueryRequestEvent({
				predicate: this._itemsQuery ?? (() => true),
			}),
		);

		this._position = 0;
	}
}
