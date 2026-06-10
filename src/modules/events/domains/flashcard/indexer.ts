import { IEvent } from '@/interfaces/IEvent';
import { FlashcardMetadata } from '@/schemas';
import { IndexAction } from '@/types/indexes';
import { EventFactory } from '../../core/Event';

type IndexEventType = `Flashcard:Index:${Capitalize<IndexAction>}`;

const t: Record<IndexAction, IndexEventType> = {
	create: 'Flashcard:Index:Create',
	delete: 'Flashcard:Index:Delete',
	update: 'Flashcard:Index:Update',
	query: 'Flashcard:Index:Query',
	get: 'Flashcard:Index:Get',
	getAll: 'Flashcard:Index:GetAll',
	initialize: 'Flashcard:Index:Initialize',
	save: 'Flashcard:Index:Save',
	state: 'Flashcard:Index:State',
};

type FlashcardIndexEventData = { flashcards: FlashcardMetadata[]; total: number };

const FlashcardIndexCreateRequestEvent = EventFactory.createRequest<FlashcardMetadata>(t.create);
type FlashcardIndexCreateRequestEvent = IEvent<FlashcardMetadata>;

const FlashcardIndexCreateResponseEvent = EventFactory.createResponse<FlashcardMetadata>(t.create);
type FlashcardIndexCreateResponseEvent = IEvent<FlashcardMetadata>;

const FlashcardIndexDeleteRequestEvent = EventFactory.createRequest<FlashcardMetadata>(t.delete);
type FlashcardIndexDeleteRequestEvent = IEvent<FlashcardMetadata>;

const FlashcardIndexDeleteResponseEvent = EventFactory.createResponse<FlashcardMetadata | null>(
	t.delete,
);
type FlashcardIndexDeleteResponseEvent = IEvent<FlashcardMetadata | null>;

const FlashcardIndexUpdateRequestEvent = EventFactory.createRequest<Partial<FlashcardMetadata>>(
	t.update,
);
type FlashcardIndexUpdateRequestEvent = IEvent<Partial<FlashcardMetadata>>;

const FlashcardIndexUpdateResponseEvent = EventFactory.createResponse<FlashcardMetadata>(t.update);
type FlashcardIndexUpdateResponseEvent = IEvent<FlashcardMetadata>;

type FlashcardIndexQueryEventData = {
	predicate: (f: FlashcardMetadata) => boolean;
};

const FlashcardIndexQueryRequestEvent = EventFactory.createRequest<FlashcardIndexQueryEventData>(
	t.query,
);
type FlashcardIndexQueryRequestEvent = IEvent<FlashcardIndexQueryEventData>;

const FlashcardIndexQueryResponseEvent = EventFactory.createResponse<FlashcardMetadata[]>(t.query);
type FlashcardIndexQueryResponseEvent = IEvent<FlashcardMetadata[]>;

type FlashcardIndexGetEventData = { id: string };

const FlashcardIndexGetRequestEvent = EventFactory.createRequest<FlashcardIndexGetEventData>(t.get);
type FlashcardIndexGetRequestEvent = IEvent<FlashcardIndexGetEventData>;

const FlashcardIndexGetResponseEvent = EventFactory.createResponse<FlashcardMetadata | null>(t.get);
type FlashcardIndexGetResponseEvent = IEvent<FlashcardMetadata | null>;

const FlashcardIndexGetAllRequestEvent = EventFactory.createRequest<void>(t.getAll);
type FlashcardIndexGetAllRequestEvent = IEvent<void>;

const FlashcardIndexGetAllResponseEvent = EventFactory.createResponse<FlashcardMetadata[]>(
	t.getAll,
);
type FlashcardIndexGetAllResponseEvent = IEvent<FlashcardMetadata[]>;

const FlashcardIndexInitEvent = EventFactory.createEvent<void>(t.initialize);
type FlashcardIndexInitEvent = IEvent<void>;

const FlashcardIndexSaveEvent = EventFactory.createEvent<FlashcardIndexEventData>(t.save);
type FlashcardIndexSaveEvent = IEvent<FlashcardIndexEventData>;

const FlashcardIndexStateEvent = EventFactory.createEvent<FlashcardIndexEventData>(t.state);
type FlashcardIndexStateEvent = IEvent<FlashcardIndexEventData>;

export {
	FlashcardIndexCreateRequestEvent,
	FlashcardIndexCreateResponseEvent,
	FlashcardIndexDeleteRequestEvent,
	FlashcardIndexDeleteResponseEvent,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexGetRequestEvent,
	FlashcardIndexGetResponseEvent,
	FlashcardIndexInitEvent,
	FlashcardIndexQueryRequestEvent,
	FlashcardIndexQueryResponseEvent,
	FlashcardIndexSaveEvent,
	FlashcardIndexStateEvent,
	FlashcardIndexUpdateRequestEvent,
	FlashcardIndexUpdateResponseEvent,
};
