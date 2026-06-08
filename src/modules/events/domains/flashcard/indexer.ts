import { FlashcardMetadata } from '@/schemas';
import { IndexAction } from '@/types/indexes';
import { Event, EventRequest, EventResponse } from '../../core/Event';

type IndexEventType = `Flashcard:Index:${Capitalize<IndexAction>}`;

const t: Record<IndexAction, IndexEventType> = {
	get: 'Flashcard:Index:Get',
	getAll: 'Flashcard:Index:GetAll',
	update: 'Flashcard:Index:Update',
	create: 'Flashcard:Index:Create',
	delete: 'Flashcard:Index:Delete',
	initialize: 'Flashcard:Index:Initialize',
	save: 'Flashcard:Index:Save',
	recalc: 'Flashcard:Index:Recalc',
	query: 'Flashcard:Index:Query',
};

export type FlashcardIndexEventData = { flashcards: FlashcardMetadata[]; total: number };

export class FlashcardIndexCreateRequestEvent extends EventRequest<FlashcardMetadata> {
	constructor(data: FlashcardMetadata) {
		super(t.create, data);
	}
}

export class FlashcardIndexCreateResponseEvent extends EventResponse<FlashcardMetadata> {
	constructor(data: FlashcardMetadata) {
		super(t.create, data);
	}
}

export class FlashcardIndexDeleteRequestEvent extends EventRequest<FlashcardMetadata> {
	constructor(data: FlashcardMetadata) {
		super(t.delete, data);
	}
}

export class FlashcardIndexDeleteResponseEvent extends EventResponse<FlashcardMetadata | null> {
	constructor(data: FlashcardMetadata | null) {
		super(t.delete, data);
	}
}

export class FlashcardIndexUpdateRequestEvent extends EventRequest<Partial<FlashcardMetadata>> {
	constructor(data: Partial<FlashcardMetadata>) {
		super(t.update, data);
	}
}

export class FlashcardIndexUpdateResponseEvent extends EventResponse<FlashcardMetadata> {
	constructor(data: FlashcardMetadata) {
		super(t.update, data);
	}
}

type FlashcardIndexQueryEventData = {
	predicate: (f: FlashcardMetadata) => boolean;
};

export class FlashcardIndexQueryRequestEvent extends EventRequest<FlashcardIndexQueryEventData> {
	constructor(data: FlashcardIndexQueryEventData) {
		super(t.query, data);
	}
}

export class FlashcardIndexQueryResponseEvent extends EventResponse<FlashcardMetadata[]> {
	constructor(data: FlashcardMetadata[]) {
		super(t.query, data);
	}
}

type FlashcardIndexGetEventData = { id: string };

export class FlashcardIndexGetRequestEvent extends EventRequest<FlashcardIndexGetEventData> {
	constructor(data: FlashcardIndexGetEventData) {
		super(t.get, data);
	}
}

export class FlashcardIndexGetResponseEvent extends EventResponse<FlashcardMetadata | null> {
	constructor(data: FlashcardMetadata | null) {
		super(t.get, data);
	}
}

export class FlashcardIndexGetAllRequestEvent extends EventRequest<undefined> {
	constructor() {
		super(t.getAll, undefined);
	}
}

export class FlashcardIndexGetAllResponseEvent extends EventResponse<FlashcardMetadata[]> {
	constructor(data: FlashcardMetadata[]) {
		super(t.getAll, data);
	}
}

export class FlashcardIndexInitializeEvent extends Event<FlashcardIndexEventData> {
	constructor(data: FlashcardIndexEventData) {
		super(t.initialize, data);
	}
}

export class FlashcardIndexSaveEvent extends Event<FlashcardIndexEventData> {
	constructor(data: FlashcardIndexEventData) {
		super(t.save, data);
	}
}
