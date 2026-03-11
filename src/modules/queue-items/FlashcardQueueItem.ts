import { Flashcard } from "@/schemas";
import { BaseQueueItem } from "./BaseQueueItem";
import { IEngine } from "@/interfaces/IEngine";

export class FlashcardQueueItem extends BaseQueueItem<Flashcard> {
  constructor(item: Flashcard, engine: IEngine<Flashcard>) {
    super(item, engine)
  }
}
