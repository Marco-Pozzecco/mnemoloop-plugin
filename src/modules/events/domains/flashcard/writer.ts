import { Flashcard, FlashcardContent, FlashcardYaml } from '@/schemas';
import { WriterAction } from '@/types/writers';
import { EventRequest, EventResponse } from '../../core/Event';

type Writers = 'flashcard';
type WriterEventType = `${Capitalize<Writers>}:Writer:${Capitalize<WriterAction>}`;

const t: Record<WriterAction, WriterEventType> = {
	create: 'Flashcard:Writer:Create',
	update: 'Flashcard:Writer:Update',
	fm: 'Flashcard:Writer:Fm',
	body: 'Flashcard:Writer:Body',
	delete: 'Flashcard:Writer:Delete',
};

type FlashcardWriterCreateEventData = Pick<Flashcard, 'front' | 'back' | 'source'>;

export class FlashcardWriterCreateRequestEvent extends EventRequest<FlashcardWriterCreateEventData> {
	constructor(data: FlashcardWriterCreateEventData) {
		super(t.create, data);
	}
}

export class FlashcardWriterCreateResponseEvent extends EventResponse<{ filepath: string }> {
	constructor(data: { filepath: string }) {
		super(t.create, data);
	}
}

type FlashcardWriterUpdateEventData = Pick<Flashcard, 'uuid' | 'front' | 'back' | 'source'>;

export class FlashcardWriterUpdateRequestEvent extends EventRequest<FlashcardWriterUpdateEventData> {
	constructor(data: FlashcardWriterUpdateEventData) {
		super(t.update, data);
	}
}

export class FlashcardWriterUpdateResponseEvent extends EventResponse<{ filepath: string }> {
	constructor(data: { filepath: string }) {
		super(t.update, data);
	}
}

type FlashcardWriterDeleteEventData = Pick<Flashcard, 'uuid'>;

export class FlashcardWriterDeleteRequestEvent extends EventRequest<FlashcardWriterDeleteEventData> {
	constructor(data: FlashcardWriterDeleteEventData) {
		super(t.delete, data);
	}
}

export class FlashcardWriterDeleteResponseEvent extends EventResponse<{ filepath: string }> {
	constructor(data: { filepath: string }) {
		super(t.delete, data);
	}
}

type FlashcardWriterFmEventData = { fm: Partial<FlashcardYaml>; filepath: string };

export class FlashcardWriterFmRequestEvent extends EventRequest<FlashcardWriterFmEventData> {
	constructor(data: FlashcardWriterFmEventData) {
		super(t.fm, data);
	}
}

export class FlashcardWriterFmResponseEvent extends EventResponse<{ filepath: string }> {
	constructor(data: { filepath: string }) {
		super(t.fm, data);
	}
}

type FlashcardWriterBodyEventData = FlashcardContent;

export class FlashcardWriterBodyRequestEvent extends EventRequest<
	FlashcardWriterBodyEventData & { filepath: string }
> {
	constructor(data: FlashcardWriterBodyEventData & { filepath: string }) {
		super(t.body, data);
	}
}

export class FlashcardWriterBodyResponseEvent extends EventResponse<{ filepath: string }> {
	constructor(data: { filepath: string }) {
		super(t.body, data);
	}
}
