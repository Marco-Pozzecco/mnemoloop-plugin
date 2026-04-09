import { IParser } from '@/interfaces/IParser';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { Flashcard, FlashcardYaml } from '@/schemas';
import { EventType, ReviewFlashcardEvent } from '@/types/events';
import { EventBus } from '../event-bus/EventBus';
import { BaseReviewItem } from './BaseReviewItem';

export class FlashcardReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	constructor(
		filepath: string,
		engine: IReviewEngine<FlashcardYaml>,
		parser: IParser<Flashcard, FlashcardYaml>,
	) {
		super(filepath, engine, parser);
	}

	review: <Score extends number>(score: Score) => void = (score) => {
		if (!this._data) throw new Error('Review item not initialized');
		const result = this._engine.calculate(this._data, score);
		this._data = { ...this._data, ...result };

		const event: ReviewFlashcardEvent = {
			event_type: EventType.ReviewFlashcard,
			filepath: this._filepath,
			created_at: new Date(),
			data: result,
			rating: score,
		};
		EventBus.instance.publish(event);
	};
}
