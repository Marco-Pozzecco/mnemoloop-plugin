import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';

export enum IndexKey {
	flashcard = 'flashcard',
}

interface IndexMap {
	[IndexKey.flashcard]: FlashcardIndexer;
}

export type IndexType<K extends IndexKey = IndexKey> = IndexMap[K];

export type Indexes = Map<IndexKey, IndexType>;

export enum IndexAction {
	Get = 'get',
	GetAll = 'getAll',
	Update = 'update',
	Create = 'create',
	Delete = 'delete',
	Initialize = 'initialize',
	Save = 'save',
	State = 'state',
	Query = 'query',
}
