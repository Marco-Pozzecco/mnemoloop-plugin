import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { Flashcard } from '@/schemas';
import { EventType, ReviewFlashcardEvent } from '@/types/events';
import { EventBus } from '../event-bus/EventBus';
import { BaseReviewItem } from './BaseReviewItem';

export class FlashcardReviewItem extends BaseReviewItem<Flashcard> {
	constructor(item: Flashcard, filepath: string, engine: IReviewEngine<Flashcard>) {
		super(item, filepath, engine);
	}

	review: <Score extends number>(score: Score) => void = (score) => {
		this._data = this._engine.calculate(this._data, score);
		const event: ReviewFlashcardEvent = {
			event_type: EventType.ReviewFlashcard,
			filepath: this._filepath,
			created_at: new Date(),
			data: this._data,
			rating: score,
		};
		EventBus.instance.publish(event);
	};
}
