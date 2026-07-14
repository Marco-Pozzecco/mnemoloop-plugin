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

export class QuizReviewItem extends BaseReviewItem<Flashcard, FlashcardYaml> {
	private _unsubscribe: () => void;

	constructor(filepath: string, engine: IReviewEngine<FlashcardYaml>) {
		super(filepath, engine);

		const responseHandler = async (event: FlashcardParserParseResponseEvent) => {
			if (event.data.filepath === filepath) {
				this._data = event.data.entity;
			}
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardParserParseResponseEvent,
			responseHandler,
		);

		void EventBus.instance.publish(new FlashcardParserParseRequestEvent({ filepath }));
	}

	review: <Score extends number>(score: Score) => void = (score) => {
		if (!this._data) throw new Error('Review item not initialized');

		const rating = score === 3 ? 3 : 1;
		const result = this._engine.calculate(this._data, rating);
		this._data = { ...this._data, ...result };

		void EventBus.instance.publish(
			new FlashcardReviewSessionScoreEvent({
				...result,
				rating: score,
				filepath: this._filepath,
			}),
		);
	};

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

		void EventBus.instance.publish(event);
	}

	dispose(): void {
		this._unsubscribe();
	}
}
