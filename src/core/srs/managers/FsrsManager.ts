import { FsrsEngine } from '../engines/FsrsEngine';
import { Flashcard } from '../../parser/types';
import { FsrsCalculationInput, CardRating } from '../types';

/**
 * Service for scheduling the next review of a flashcard.
 * Orchestrates the calculation of FSRS parameters and updates the flashcard object.
 */
export class FsrsScheduler {
	private engine: FsrsEngine;

	constructor() {
		this.engine = new FsrsEngine();
	}

	/**
	 * Calculates and applies the next review schedule for a flashcard based on user rating.
	 *
	 * @param card Flashcard to update
	 * @param rating User rating (Again, Hard, Good, Easy)
	 * @param reviewTime Optional override for review timestamp
	 * @returns The updated flashcard object
	 */
	scheduleNextReview(card: Flashcard, rating: CardRating, reviewTime?: string): Flashcard {
		const input: FsrsCalculationInput = {
			current_params: card.srs,
			rating: rating,
			review_time: reviewTime,
		};

		const result = this.engine.calculate(input);

		card.srs = result.updated_params;
		card.updated = reviewTime || new Date().toISOString();

		return card;
	}
}
