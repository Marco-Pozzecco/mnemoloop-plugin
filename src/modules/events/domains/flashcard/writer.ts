import { IEvent } from '@/interfaces/IEvent';
import { Flashcard, FlashcardContent, FlashcardYaml } from '@/schemas';
import { WriterAction } from '@/types/writers';
import { EventFactory } from '../../core/Event';

type Writers = 'flashcard';
type WriterEventType = `${Capitalize<Writers>}:Writer:${Capitalize<WriterAction>}`;

const t: Record<WriterAction, WriterEventType> = {
	create: 'Flashcard:Writer:Create',
	update: 'Flashcard:Writer:Update',
	fm: 'Flashcard:Writer:Fm',
	body: 'Flashcard:Writer:Body',
	delete: 'Flashcard:Writer:Delete',
};

type FlashcardWriterCreateEventData = Pick<Flashcard, 'content' | 'source' | 'decks'>;

const FlashcardWriterCreateRequestEvent =
	EventFactory.createRequest<FlashcardWriterCreateEventData>(t.create);
type FlashcardWriterCreateRequestEvent = IEvent<FlashcardWriterCreateEventData>;

const FlashcardWriterCreateResponseEvent = EventFactory.createResponse<{ filepath: string }>(
	t.create,
);
type FlashcardWriterCreateResponseEvent = IEvent<{ filepath: string }>;

type FlashcardWriterUpdateEventData = Partial<Flashcard>;

const FlashcardWriterUpdateRequestEvent =
	EventFactory.createRequest<FlashcardWriterUpdateEventData>(t.update);
type FlashcardWriterUpdateRequestEvent = IEvent<FlashcardWriterUpdateEventData>;

const FlashcardWriterUpdateResponseEvent = EventFactory.createResponse<{ filepath: string }>(
	t.update,
);
type FlashcardWriterUpdateResponseEvent = IEvent<{ filepath: string }>;

type FlashcardWriterDeleteEventData = Pick<Flashcard, 'uuid'>;

const FlashcardWriterDeleteRequestEvent =
	EventFactory.createRequest<FlashcardWriterDeleteEventData>(t.delete);
type FlashcardWriterDeleteRequestEvent = IEvent<FlashcardWriterDeleteEventData>;

const FlashcardWriterDeleteResponseEvent = EventFactory.createResponse<{ filepath: string }>(
	t.delete,
);
type FlashcardWriterDeleteResponseEvent = IEvent<{ filepath: string }>;

type FlashcardWriterFmEventData = { fm: Partial<FlashcardYaml>; filepath: string };

const FlashcardWriterFmRequestEvent = EventFactory.createRequest<FlashcardWriterFmEventData>(t.fm);
type FlashcardWriterFmRequestEvent = IEvent<FlashcardWriterFmEventData>;

const FlashcardWriterFmResponseEvent = EventFactory.createResponse<{ filepath: string }>(t.fm);
type FlashcardWriterFmResponseEvent = IEvent<{ filepath: string }>;

type FlashcardWriterBodyEventData = { content: FlashcardContent; filepath: string };

const FlashcardWriterBodyRequestEvent = EventFactory.createRequest<FlashcardWriterBodyEventData>(
	t.body,
);
type FlashcardWriterBodyRequestEvent = IEvent<FlashcardWriterBodyEventData>;

const FlashcardWriterBodyResponseEvent = EventFactory.createResponse<{ filepath: string }>(t.body);
type FlashcardWriterBodyResponseEvent = IEvent<{ filepath: string }>;

export {
	FlashcardWriterBodyRequestEvent,
	FlashcardWriterBodyResponseEvent,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardWriterFmResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
};
