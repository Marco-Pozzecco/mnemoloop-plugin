import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { Flashcard, FlashcardYaml } from '@/schemas';
import {
	EventBus,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardReviewSessionScoreEvent,
} from '../events';
import { BaseReviewItem } from './BaseReviewItem';

export class FlashcardReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	constructor(filepath: string, engine: IReviewEngine<FlashcardYaml>) {
		super(filepath, engine);

		EventBus.instance.subscribe((event) => {
			if (event.isType(FlashcardParserParseResponseEvent.type)) {
				const { data } = event as FlashcardParserParseResponseEvent;
				if (data.filepath === filepath) {
					this._data = data.entity;
				}
			}
		});

		EventBus.instance.publish(new FlashcardParserParseRequestEvent({ filepath }));
	}

	review: <Score extends number>(score: Score) => void = (score) => {
		if (!this._data) throw new Error('Review item not initialized');
		const result = this._engine.calculate(this._data, score);
		this._data = { ...this._data, ...result };

		EventBus.instance.publish(
			new FlashcardReviewSessionScoreEvent({
				...result,
				rating: score,
				filepath: this._filepath,
			}),
		);
	};
}
