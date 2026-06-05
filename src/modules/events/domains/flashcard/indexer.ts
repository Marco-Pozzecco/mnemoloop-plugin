import { FlashcardMetadata } from '@/schemas';
import { Event } from '../../core/Event';

export enum IndexAction {
	Get = 'get',
	GetAll = 'getAll',
	Update = 'update',
	Create = 'create',
	Delete = 'delete',
	Initialize = 'initialize',
	Save = 'save',
	Recalc = 'recalc',
	Query = 'query',
}

type IndexEventType = `Flashcard:Index:${Capitalize<IndexAction>}`;

export type FlashcardIndexEventData = { flashcards: FlashcardMetadata[]; total: number };

export class FlashcardIndexCreatedEvent extends Event<FlashcardMetadata> {
	static readonly type: IndexEventType = 'Flashcard:Index:Create';

	constructor(data: FlashcardMetadata) {
		super(FlashcardIndexCreatedEvent.type, data);
	}
}

export class FlashcardIndexDeletedEvent extends Event<FlashcardMetadata> {
	static readonly type: IndexEventType = 'Flashcard:Index:Delete';

	constructor(data: FlashcardMetadata) {
		super(FlashcardIndexDeletedEvent.type, data);
	}
}

export class FlashcardIndexInitializeEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Initialize';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexInitializeEvent.type, data);
	}
}

export class FlashcardIndexSaveEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Save';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexSaveEvent.type, data);
	}
}

export class FlashcardIndexUpdateEvent extends Event<Partial<FlashcardMetadata>> {
	static readonly type: IndexEventType = 'Flashcard:Index:Update';

	constructor(data: Partial<FlashcardMetadata>) {
		super(FlashcardIndexUpdateEvent.type, data);
	}
}

type FlashcardIndexQueryEventData = {
	predicate: (f: FlashcardMetadata) => boolean;
};

export class FlashcardIndexQueryEvent extends Event<FlashcardIndexQueryEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Query';

	constructor(data: FlashcardIndexQueryEventData) {
		super(FlashcardIndexQueryEvent.type, data);
	}
}

type FlashcardIndexGetEventData = { id: string };

export class FlashcardIndexGetEvent extends Event<FlashcardIndexGetEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Get';

	constructor(data: FlashcardIndexGetEventData) {
		super(FlashcardIndexGetEvent.type, data);
	}
}

export class FlashcardIndexGetAllEvent extends Event<undefined> {
	static readonly type: IndexEventType = 'Flashcard:Index:GetAll';

	constructor() {
		super(FlashcardIndexGetAllEvent.type, undefined);
	}
}

export class FlashcardIndexRecalcEvent extends Event<undefined> {
	static readonly type: IndexEventType = 'Flashcard:Index:Recalc';

	constructor() {
		super(FlashcardIndexRecalcEvent.type, undefined);
	}
}
