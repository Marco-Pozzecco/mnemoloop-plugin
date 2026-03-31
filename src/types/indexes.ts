import { IIndexer } from '@/interfaces/IIndexer';
import { Flashcard } from '@/schemas';
import { capitalize } from '@/utils/String';
import { EventData } from './events';

export enum IndexKey {
	flashcard = 'flashcard',
}

interface IndexMap {
	[IndexKey.flashcard]: IIndexer<Flashcard>;
}

export type IndexType<K extends IndexKey = IndexKey> = IndexMap[K];

export type Indexes = Map<IndexKey, IndexType>;

type OmittedActions = keyof Pick<
	IIndexer<unknown>,
	'index' | 'upsert' | 'getAll' | 'query' | 'get'
>;
export type IndexActions = keyof Omit<IIndexer<unknown>, OmittedActions>;

type IndexDataSchema = {
	flashcard: {
		flashcards: Flashcard[];
		total: number;
	};
};

export type IndexDataKey = keyof IndexDataSchema;

type IndexEntityEvents<K extends keyof IndexDataSchema> = {
	[A in IndexActions]: A extends 'save'
		? EventData<IndexDataSchema[K] & { saved_at: Date }>
		: EventData<IndexDataSchema[K]>;
};

export type IndexFlashcardEvents = IndexEntityEvents<'flashcard'>;

export type IndexEventsKeys = Record<IndexKey, Record<IndexActions, IndexEventEnumValue>>;

export const IndexEventsKeys: IndexEventsKeys = {
	flashcard: generateKeys('FLASHCARD'),
};

export type IndexEventsOf<K extends keyof IndexEventsKeys> = IndexEventsKeys[K];

type IndexEventEnumKeys = `Index${Capitalize<IndexKey>}${Capitalize<IndexActions>}`;
type IndexEventEnumValue = `INDEX:${Uppercase<IndexKey>}:${Uppercase<IndexActions>}`;
type IndexEventEnum = Record<IndexEventEnumKeys, IndexEventEnumValue>;

export const IndexEventType = flattenIndexKeys(IndexEventsKeys);
export type IndexEventType = IndexEventEnum[keyof typeof IndexEventType];

// utils
function generateKeys(entity: Uppercase<IndexKey>): Record<IndexActions, IndexEventEnumValue> {
	return {
		update: `INDEX:${entity}:UPDATE`,
		create: `INDEX:${entity}:CREATE`,
		delete: `INDEX:${entity}:DELETE`,
		initialize: `INDEX:${entity}:INITIALIZE`,
		save: `INDEX:${entity}:SAVE`,
	};
}
function flattenIndexKeys(obj: IndexEventsKeys): IndexEventEnum {
	const result: Record<string, string> = {};
	for (const [entity, actions] of Object.entries(obj)) {
		for (const [action, key] of Object.entries(actions)) {
			const enumKey = `Index${capitalize(entity)}${capitalize(action)}`;
			result[enumKey] = key;
		}
	}
	return result as IndexEventEnum;
}
