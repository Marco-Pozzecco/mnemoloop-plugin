import { Flashcard, CardType, FlashcardYaml } from '@/schemas';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export class ReviewItemFactory {
	private _ctors = new Map<
		CardType,
		(filepath: string, engine: IReviewEngine<FlashcardYaml>) => IReviewItem<Flashcard>
	>();

	register(
		cardType: CardType,
		ctor: (filepath: string, engine: IReviewEngine<FlashcardYaml>) => IReviewItem<Flashcard>,
	): void {
		this._ctors.set(cardType, ctor);
	}

	create(
		cardType: CardType,
		filepath: string,
		engine: IReviewEngine<FlashcardYaml>,
	): IReviewItem<Flashcard> {
		const ctor = this._ctors.get(cardType);
		if (!ctor) {
			throw new Error(`no ReviewItem registered for card_type: ${cardType}`);
		}
		return ctor(filepath, engine);
	}
}

/** Singleton instance — populated at plugin startup by main.ts. */
export const reviewItemFactory = new ReviewItemFactory();
