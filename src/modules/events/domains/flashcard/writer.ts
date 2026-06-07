import { Flashcard, FlashcardContent, FlashcardYaml } from '@/schemas';
import { WriterAction } from '@/types/writers';
import { Event } from '../../core/Event';

type Writers = 'flashcard';
type WriterEventType = `${Capitalize<Writers>}:Writer:${Capitalize<WriterAction>}`;

// Flashcard Writer Action Events
type FlashcardWriterCreateEventData = Pick<Flashcard, 'front' | 'back' | 'source'>;

export class FlashcardWriterCreateEvent extends Event<FlashcardWriterCreateEventData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Create';

	constructor(data: FlashcardWriterCreateEventData) {
		super(FlashcardWriterCreateEvent.type, data);
	}
}

type FlashcardWriterUpdateEventData = Pick<Flashcard, 'uuid' | 'front' | 'back' | 'source'>;

export class FlashcardWriterUpdateEvent extends Event<FlashcardWriterUpdateEventData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Update';

	constructor(data: FlashcardWriterUpdateEventData) {
		super(FlashcardWriterUpdateEvent.type, data);
	}
}

type FlashcardWriterDeleteEventData = Pick<Flashcard, 'uuid'>;

export class FlashcardWriterDeleteEvent extends Event<FlashcardWriterDeleteEventData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Delete';

	constructor(data: FlashcardWriterDeleteEventData) {
		super(FlashcardWriterDeleteEvent.type, data);
	}
}

type FlashcardWriterFmEventData = { fm: Partial<FlashcardYaml>; filepath: string };

export class FlashcardWriterFmEvent extends Event<FlashcardWriterFmEventData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Fm';

	constructor(data: FlashcardWriterFmEventData) {
		super(FlashcardWriterFmEvent.type, data);
	}
}

type FlashcardWriterBodyEventData = FlashcardContent;

export class FlashcardWriterBodyEvent extends Event<
	FlashcardWriterBodyEventData & { filepath: string }
> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Body';

	constructor(data: FlashcardWriterBodyEventData & { filepath: string }) {
		super(FlashcardWriterBodyEvent.type, data);
	}
}
