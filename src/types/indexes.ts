import { IIndexer } from '@/interfaces/IIndexer';
import { FlashcardMetadata } from '@/schemas';

export enum IndexKey {
	flashcard = 'flashcard',
}

interface IndexMap {
	[IndexKey.flashcard]: IIndexer<FlashcardMetadata>;
}

export type IndexType<K extends IndexKey = IndexKey> = IndexMap[K];

export type Indexes = Map<IndexKey, IndexType>;
