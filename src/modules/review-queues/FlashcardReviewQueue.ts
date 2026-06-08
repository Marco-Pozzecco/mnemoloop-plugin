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
	private _unsubscribe?: () => void;

	constructor(predicate: (entity: FlashcardMetadata) => boolean) {
		const engine = new FsrsEngine();

		super(engine, predicate);

		const responseHandler = (event: FlashcardIndexQueryResponseEvent) => {
			const sortedData = this._engine.sort(event.data);
			this._items = sortedData.map((f) => new FlashcardReviewItem(f.file, engine));
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardIndexQueryResponseEvent.type,
			responseHandler,
		);

		EventBus.instance.publish(
			new FlashcardIndexQueryRequestEvent({
				predicate: this._itemsQuery,
			}),
		);
	}

	recalc(): void {
		EventBus.instance.publish(
			new FlashcardIndexQueryRequestEvent({
				predicate: this._itemsQuery ?? (() => false),
			}),
		);

		this._position = 0;
	}

	dispose(): void {
		this._unsubscribe?.();
		for (const item of this._items) {
			item.dispose();
		}
	}
}
