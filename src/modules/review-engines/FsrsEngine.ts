import type { FlashcardYaml } from '@/schemas/flashcard';
import type { FSRSParams } from '@/schemas/srs';
import { Card, FSRS, FSRSParameters, generatorParameters, Rating, State } from 'ts-fsrs';
import { EventData } from '@/types/events';
import { BaseReviewEngine } from './BaseReviewEngine';

export class FsrsEngine extends BaseReviewEngine<FlashcardYaml> {
	private readonly STATE_PRIORITY: Record<number, number> = {
		[State.Learning]: 0,
		[State.Relearning]: 1,
		[State.Review]: 2,
		[State.New]: 3,
	};

	private fsrs: FSRS;

	constructor() {
		super();
		this.fsrs = new FSRS(generatorParameters());
	}

	/**
	 * Sorts flashcards in-place by due date + state priority.
	 * @param list Flashcards to sort (mutated in-place)
	 * @returns The same sorted array reference
	 */
	sort: <T extends FlashcardYaml>(list: T[]) => T[] = (list) => {
		return list.sort((a, b) => {
			const dueDiff = new Date(a.due).getTime() - new Date(b.due).getTime();
			if (dueDiff !== 0) return dueDiff;

			const priorityA = this.STATE_PRIORITY[a.state] ?? 99;
			const priorityB = this.STATE_PRIORITY[b.state] ?? 99;
			return priorityA - priorityB;
		});
	};

	/**
	 * Calculates updated FSRS parameters based on a user rating.
	 * @returns Updated Flashcard entity
	 */
	calculate: <T extends FlashcardYaml>(item: T, score: Exclude<Rating, 0>) => T = (item, score) => {
		const params = item;
		const card: Card = this.mapToFsrsCard(params);
		const reviewTime = new Date();

		const record = this.fsrs.repeat(card, reviewTime);
		const updatedCard = record[score].card;

		return {
			...item,
			...this.mapFromFsrsCard(updatedCard),
		};
	};

	/**
	 * Updates the underlying FSRS algorithm parameters.
	 */
	updateParameters(params: Partial<FSRSParameters>): void {
		this.fsrs.parameters = params;
	}

	dispatch: (event: string, data: EventData<FlashcardYaml>) => void = () => {
		// do nothing
	};

	/**
	 * Maps internal FSRSStats to ts-fsrs Card object.
	 */
	private mapToFsrsCard(params: FSRSParams): Card {
		return {
			due: new Date(params.due),
			stability: params.stability,
			difficulty: params.difficulty,
			elapsed_days: params.elapsed_days,
			scheduled_days: params.scheduled_days,
			learning_steps: params.learning_steps,
			reps: params.reps,
			lapses: params.lapses,
			state: params.state,
			last_review: params.last_review ? new Date(params.last_review) : undefined,
		};
	}

	/**
	 * Maps ts-fsrs Card object back to internal FSRSStats.
	 */
	private mapFromFsrsCard(card: Card): FSRSParams {
		return {
			stability: card.stability,
			difficulty: card.difficulty,
			elapsed_days: card.elapsed_days,
			scheduled_days: card.scheduled_days,
			learning_steps: card.learning_steps,
			reps: card.reps,
			lapses: card.lapses,
			state: card.state,
			last_review: card.last_review ? card.last_review.toISOString() : null,
			due: card.due.toISOString(),
		};
	}
}
