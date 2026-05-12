import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { Flashcard, FlashcardYaml } from '@/schemas';
import {
	EventBus,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardWriterFmRequestEvent,
} from '../events';
import { BaseReviewItem } from './BaseReviewItem';
import { EventCallback } from '@/interfaces/IEventBus';

export class FlashcardReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	private _callback: EventCallback;

	constructor(filepath: string, engine: IReviewEngine<FlashcardYaml>) {
		super(filepath, engine);

		this._callback = EventBus.instance.subscribe((event) => {
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

	/**
	 * Restore the flashcard to a previous FSRS state (for undo)
	 */
	restore(due: string | null, stability: number | null, difficulty: number | null): void {
		if (!this._data) return;

		if (due !== null) {
			this._data.due = due;
		}
		if (stability !== null) {
			this._data.stability = stability;
		}
		if (difficulty !== null) {
			this._data.difficulty = difficulty;
		}

		const event = new FlashcardWriterFmRequestEvent({
			fm: {
				due: this._data.due,
				stability: this._data.stability,
				difficulty: this._data.difficulty,
			},
			filepath: this._filepath,
		});

		EventBus.instance.publish(event);
	}

	dispose(): void {
		EventBus.instance.unsubscribe(this._callback);
	}
}
