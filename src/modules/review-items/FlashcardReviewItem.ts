import { Flashcard } from "@/schemas";
import { BaseReviewItem } from "./BaseReviewItem";
import { IEngine } from "@/interfaces/IEngine";
import { ISubscriber } from "@/interfaces/ISubscriber";

export class FlashcardReviewItem extends BaseReviewItem<Flashcard> {
  constructor(item: Flashcard, filepath: string, engine: IEngine<Flashcard>, subscribers: ISubscriber<Flashcard>[]) {
    super(item, filepath, engine, subscribers)
  }
}
