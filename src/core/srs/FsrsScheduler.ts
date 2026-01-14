import { FsrsController } from './FsrsController';
import { Flashcard } from '../parser/types';
import { FsrsCalculationInput, CardRating } from './types';

export class FsrsScheduler {
	private fsrsController: FsrsController;

	constructor(fsrsController?: FsrsController) {
		this.fsrsController = fsrsController || new FsrsController();
	}

	scheduleNextReview(card: Flashcard, rating: CardRating, reviewTime?: string): Flashcard {
		const input: FsrsCalculationInput = {
			current_params: card.srs,
			rating: rating,
			review_time: reviewTime,
		};

		const result = this.fsrsController.calculate(input);

		card.srs = result.updated_params;
		card.updated = reviewTime || new Date().toISOString();

		return card;
	}

	getFsrsController(): FsrsController {
		return this.fsrsController;
	}
}
