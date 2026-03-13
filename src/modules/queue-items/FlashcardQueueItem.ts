import { Flashcard } from "@/schemas";
import { BaseQueueItem } from "./BaseQueueItem";
import { IEngine } from "@/interfaces/IEngine";
import { ISubscriber } from "@/interfaces/ISubscriber";

export class FlashcardQueueItem extends BaseQueueItem<Flashcard> {
  constructor(item: Flashcard, filepath: string, engine: IEngine<Flashcard>, subscribers: ISubscriber<Flashcard>[]) {
    super(item, filepath, engine, subscribers)
  }
}
