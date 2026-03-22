import { Flashcard } from "@/schemas";
import { BaseReviewItem } from "./BaseReviewItem";
import { IReviewEngine } from "@/interfaces/IReviewEngine";
import { ISubscriber } from "@/interfaces/ISubscriber";

export class FlashcardReviewItem extends BaseReviewItem<Flashcard> {
  constructor(item: Flashcard, filepath: string, engine: IReviewEngine<Flashcard>, subscribers: ISubscriber<Flashcard>[]) {
    super(item, filepath, engine, subscribers)
  }
}
