import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';

export enum WriterKey {
	flashcard = 'flashcard',
}

interface WriterMap {
	[WriterKey.flashcard]: FlashcardWriter;
}

export type WriterType<K extends WriterKey = WriterKey> = WriterMap[K];
export type Writers = Map<WriterKey, WriterType>;

export enum WriterAction {
	Create = 'create',
	Update = 'update',
	Fm = 'fm',
	Body = 'body',
	Delete = 'delete',
}
