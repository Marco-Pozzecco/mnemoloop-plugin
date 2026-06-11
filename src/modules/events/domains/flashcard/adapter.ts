import { IEvent } from '@/interfaces/IEvent';
import { FlashcardIndex } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { EventFactory } from '../../core/Event';

type Adapters = 'flashcard';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	set: 'Flashcard:Adapter:Set',
	update: 'Flashcard:Adapter:Update',
	reset: 'Flashcard:Adapter:Reset',
	save: 'Flashcard:Adapter:Save',
	init: 'Flashcard:Adapter:Init',
	state: 'Flashcard:Adapter:State',
};

const FlashcardAdapterSetRequestEvent = EventFactory.createRequest<FlashcardIndex>(t.set);
type FlashcardAdapterSetRequestEvent = IEvent<FlashcardIndex>;

const FlashcardAdapterSetResponseEvent = EventFactory.createResponse<FlashcardIndex>(t.set);
type FlashcardAdapterSetResponseEvent = IEvent<FlashcardIndex>;

const FlashcardAdapterUpdateRequestEvent = EventFactory.createRequest<FlashcardIndex>(t.update);
type FlashcardAdapterUpdateRequestEvent = IEvent<FlashcardIndex>;

const FlashcardAdapterUpdateResponseEvent = EventFactory.createResponse<FlashcardIndex>(t.update);
type FlashcardAdapterUpdateResponseEvent = IEvent<FlashcardIndex>;

const FlashcardAdapterResetEvent = EventFactory.createEvent<FlashcardIndex>(t.reset);
type FlashcardAdapterResetEvent = IEvent<FlashcardIndex>;

const FlashcardAdapterInitEvent = EventFactory.createEvent<void>(t.init);
type FlashcardAdapterInitEvent = IEvent<void>;

const FlashcardAdapterSaveEvent = EventFactory.createEvent<void>(t.save);
type FlashcardAdapterSaveEvent = IEvent<void>;

const FlashcardAdapterStateEvent = EventFactory.createEvent<FlashcardIndex>(t.state);
type FlashcardAdapterStateEvent = IEvent<FlashcardIndex>;

export {
	FlashcardAdapterInitEvent,
	FlashcardAdapterResetEvent,
	FlashcardAdapterSaveEvent,
	FlashcardAdapterSetRequestEvent,
	FlashcardAdapterSetResponseEvent,
	FlashcardAdapterStateEvent,
	FlashcardAdapterUpdateRequestEvent,
	FlashcardAdapterUpdateResponseEvent,
};
