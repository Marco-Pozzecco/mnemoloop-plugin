import { Flashcard, FlashcardMetadata, FlashcardYaml, CardType } from '@/schemas';
import { FSRSParameters } from 'ts-fsrs';
import { FsrsEngine } from '../review-engines/FsrsEngine';
import { ReviewItemFactory } from '../review-items/ReviewItemFactory';
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
		factory: ReviewItemFactory,
		fsrsConfig?: Partial<FSRSParameters>,
	) {
		const engine = new FsrsEngine(fsrsConfig);

		super(engine, predicate);

		const responseHandler = async (event: FlashcardIndexQueryResponseEvent) => {
			const sortedData = this._engine.sort(event.data);
			this._items = sortedData.map((f) => factory.create(f.card_type, f.file, engine));
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
