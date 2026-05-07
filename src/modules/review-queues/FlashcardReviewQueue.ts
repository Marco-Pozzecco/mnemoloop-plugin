import { Flashcard, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '../events';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';
import { BaseReviewQueue } from './BaseReviewQueue';
import { IEvent } from '@/interfaces/IEvent';

export class FlashcardReviewQueue extends BaseReviewQueue<
	Flashcard,
	FlashcardMetadata,
	FlashcardYaml
> {
	private _callback: (event: IEvent) => void;

	constructor(predicate?: (entity: FlashcardMetadata) => boolean) {
		const engine = new FsrsEngine();
		super(engine, predicate);

		this._callback = (event) => {
			if (event.isType(FlashcardIndexQueryResponseEvent.type)) {
				const data = (event as FlashcardIndexQueryResponseEvent).data;
				const sortedData = this._engine.sort(data);
				this._items = sortedData.map((f) => new FlashcardReviewItem(f.file, engine));
			}
		};

		EventBus.instance.request(
			new FlashcardIndexQueryRequestEvent({
				predicate: predicate ?? (() => false),
			}),
			this._callback,
		);
	}

	recalc(): void {
		EventBus.instance.request(
			new FlashcardIndexQueryRequestEvent({
				predicate: this._itemsQuery ?? (() => false),
			}),
			this._callback,
		);

		this._position = 0;
	}

	dispose(): void {
		for (const item of this._items) {
			item.dispose();
		}
	}
}
