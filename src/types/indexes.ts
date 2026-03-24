import { IIndexer } from "@/interfaces/IIndexer";
import { Flashcard } from "@/schemas";

export enum IndexKey {
  flashcard = 'flashcard'
}

interface IndexMap {
  [IndexKey.flashcard]: IIndexer<Flashcard>;
}

export type IndexType<K extends IndexKey = IndexKey> = IndexMap[K];

export type Indexes = Map<IndexKey, IndexType>;
