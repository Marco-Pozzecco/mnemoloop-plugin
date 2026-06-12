import { Flashcard, FlashcardMetadata, FlashcardYaml } from '@/schemas';
import { FSRSParameters } from 'ts-fsrs';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { FlashcardReviewItem } from '../review-items/FlashcardReviewItem';
import {
	EventBus,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
} from '../events';
import { BaseReviewQueue } from './BaseReviewQueue';

export class FlashcardReviewQueue extends BaseReviewQueue<
	Flashcard,
	FlashcardMetadata,
	FlashcardYaml
> {
	private _unsubscribe?: () => void;

	constructor(
		predicate: (entity: FlashcardMetadata) => boolean,
		fsrsConfig?: Partial<FSRSParameters>,
	) {
		const engine = new FsrsEngine(fsrsConfig);

		super(engine, predicate);

	 
		const responseHandler = async (event: FlashcardIndexQueryResponseEvent) => {
			const sortedData = this._engine.sort(event.data);
			this._items = sortedData.map((f) => new FlashcardReviewItem(f.file, engine));
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardIndexQueryResponseEvent,
			responseHandler,
		);

		void EventBus.instance.publish(
			new FlashcardIndexQueryRequestEvent({
				predicate: this._itemsQuery,
			}),
		);
	}

	recalc(): void {
		void EventBus.instance.publish(
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
