import { Flashcard } from "@/schemas";
import { BaseReviewItem } from "./BaseReviewItem";
import { IReviewEngine } from "@/interfaces/IReviewEngine";

export class FlashcardReviewItem extends BaseReviewItem<Flashcard> {
  constructor(item: Flashcard, filepath: string, engine: IReviewEngine<Flashcard>) {
    super(item, filepath, engine)
  }
}
