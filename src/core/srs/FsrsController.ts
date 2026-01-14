import { Card, FSRS, FSRSParameters, Rating, generatorParameters, Grade } from 'ts-fsrs';
import {
	CardRating,
	DEFAULT_FSRS,
	FSRSStats,
	FsrsCalculationInput,
	FsrsCalculationResult,
} from './types';

export class FsrsController {
	private fsrs: FSRS;

	constructor() {
		this.fsrs = new FSRS(generatorParameters());
	}

	calculate(input: FsrsCalculationInput): FsrsCalculationResult {
		try {
			const { current_params, rating, review_time } = input;
			const reviewDate = review_time ? new Date(review_time) : new Date();

			const fsrsCard: Card = this.mapToFsrsCard(current_params);
			const fsrsRating = this.mapToFsrsRating(rating);

			const recordLog = this.fsrs.repeat(fsrsCard, reviewDate);
			const updatedCard = recordLog[fsrsRating as Grade].card;

			const updatedParams: FSRSStats = this.mapFromFsrsCard(updatedCard);

			const intervalDays = this.calculateIntervalDays(updatedParams.next_review, reviewDate);

			return {
				updated_params: updatedParams,
				interval_days: intervalDays,
			};
		} catch (error) {
			console.error('Error in FSRS calculation:', error);
			return {
				updated_params: this.getInitialState(),
				interval_days: 1,
			};
		}
	}

	getInitialState(): FSRSStats {
		return { ...DEFAULT_FSRS };
	}

	private mapToFsrsCard(params: FSRSStats): Card {
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

	private mapFromFsrsCard(card: Card): FSRSStats {
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

	private mapToFsrsRating(rating: CardRating): Rating {
		switch (rating) {
			case CardRating.AGAIN:
				return Rating.Again;
			case CardRating.HARD:
				return Rating.Hard;
			case CardRating.GOOD:
				return Rating.Good;
			case CardRating.EASY:
				return Rating.Easy;
			default:
				return Rating.Good;
		}
	}

	private calculateIntervalDays(nextReviewStr: string, reviewDate: Date): number {
		const nextReview = new Date(nextReviewStr);
		const diffMs = nextReview.getTime() - reviewDate.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		return Math.max(1, diffDays);
	}

	updateParameters(params: Partial<FSRSParameters>): void {
		this.fsrs.parameters = params;
	}
}
