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

export class FlashcardReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	private _unsubscribe: () => void;

	constructor(filepath: string, engine: IReviewEngine<FlashcardYaml>) {
		super(filepath, engine);

		const responseHandler = (event: FlashcardParserParseResponseEvent) => {
			if (event.data.filepath === filepath) {
				this._data = event.data.entity;
			}
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardParserParseResponseEvent,
			responseHandler,
		);

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
		this._unsubscribe();
	}
}
