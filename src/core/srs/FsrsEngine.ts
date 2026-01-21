import { DEFAULT_FSRS, ERROR_MESSAGES } from '@/utils/constants';
import { Card, FSRS, FSRSParameters, Grade, Rating, generatorParameters } from 'ts-fsrs';
import { FsrsCalculationInput, FsrsCalculationResult, FSRSParams } from './';

/**
 * Wrapper for the ts-fsrs library.
 * Handles calculation of spaced repetition parameters using the FSRS algorithm.
 */
export class FsrsEngine {
	private fsrs: FSRS;

	constructor() {
		this.fsrs = new FSRS(generatorParameters());
	}

	/**
	 * Calculates updated FSRS parameters based on a user rating.
	 *
	 * @param input FSRS calculation input (current params, rating, review time)
	 * @returns Updated FSRS parameters and interval in days
	 */
	calculate(input: FsrsCalculationInput): FsrsCalculationResult {
		try {
			const { current_params, rating, review_time } = input;
			const reviewDate = review_time ? new Date(review_time) : new Date();

			const fsrsCard: Card = this.mapToFsrsCard(current_params);

			const recordLog = this.fsrs.repeat(fsrsCard, reviewDate);
			const updatedCard = recordLog[rating].card;

			const updatedParams: FSRSParams = this.mapFromFsrsCard(updatedCard);

			const intervalDays = this.calculateIntervalDays(updatedParams.next_review, reviewDate);

			return {
				updated_params: updatedParams,
				interval_days: intervalDays,
			};
		} catch (error) {
			console.error(`${ERROR_MESSAGES.CALCULATION_ERROR}:`, error);
			return {
				updated_params: this.getInitialState(),
				interval_days: 1,
			};
		}
	}

	/**
	 * Returns default FSRS parameters for a new card.
	 */
	getInitialState(): FSRSParams {
		return { ...DEFAULT_FSRS };
	}

	/**
	 * Maps internal FSRSStats to ts-fsrs Card object.
	 */
	private mapToFsrsCard(params: FSRSParams): Card {
		return {
			due: new Date(params.next_review),
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
			next_review: card.due.toISOString(),
		};
	}

	/**
	 * Calculates the number of days between review and next review.
	 */
	private calculateIntervalDays(nextReviewStr: string, reviewDate: Date): number {
		const nextReview = new Date(nextReviewStr);
		const diffMs = nextReview.getTime() - reviewDate.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		return Math.max(1, diffDays);
	}

	/**
	 * Updates the underlying FSRS algorithm parameters.
	 */
	updateParameters(params: Partial<FSRSParameters>): void {
		this.fsrs.parameters = params;
	}
}
