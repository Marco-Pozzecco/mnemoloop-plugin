import { FlashcardMetadata } from '@/schemas';
import { Event } from '../core/Event';

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

type IndexEntities = 'flashcard';
type ReqRes = 'request' | 'response';
type IndexEventType =
	`${Capitalize<IndexEntities>}:Index:${Capitalize<IndexAction>}:${Capitalize<ReqRes>}`;

export type FlashcardIndexEventData = { flashcards: FlashcardMetadata[]; total: number };

export type FlashcardIndexCreateEventData = FlashcardMetadata;
export class FlashcardIndexCreateEvent extends Event<FlashcardIndexCreateEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Create:Response';

	constructor(data: FlashcardIndexCreateEventData) {
		super(FlashcardIndexCreateEvent.type, data);
	}
}

export type FlashcardIndexDeleteEventData = FlashcardMetadata;
export class FlashcardIndexDeleteEvent extends Event<FlashcardIndexDeleteEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Delete:Response';

	constructor(data: FlashcardIndexDeleteEventData) {
		super(FlashcardIndexDeleteEvent.type, data);
	}
}

export class FlashcardIndexInitializeEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Initialize:Response';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexInitializeEvent.type, data);
	}
}

export class FlashcardIndexSaveEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Save:Response';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexSaveEvent.type, data);
	}
}

export type FlashcardIndexUpdateEventData = FlashcardMetadata;
export class FlashcardIndexUpdateEvent extends Event<FlashcardIndexUpdateEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Update:Response';

	constructor(data: FlashcardIndexUpdateEventData) {
		super(FlashcardIndexUpdateEvent.type, data);
	}
}

export class FlashcardIndexRecalcRequestEvent extends Event<undefined> {
	static readonly type: IndexEventType = 'Flashcard:Index:Recalc:Request';

	constructor() {
		super(FlashcardIndexRecalcRequestEvent.type, undefined);
	}
}

export class FlashcardIndexRecalcResponseEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Recalc:Response';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexRecalcResponseEvent.type, data);
	}
}

export type FlashcardIndexQueryRequestEventData = {
	predicate: (f: FlashcardMetadata) => boolean;
	deckFilter?: string;
};
export class FlashcardIndexQueryRequestEvent extends Event<FlashcardIndexQueryRequestEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Query:Request';

	constructor(data: FlashcardIndexQueryRequestEventData) {
		super(FlashcardIndexQueryRequestEvent.type, data);
	}
}

export type FlashcardIndexQueryResponseEventData = FlashcardMetadata[];
export class FlashcardIndexQueryResponseEvent extends Event<FlashcardIndexQueryResponseEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Query:Response';

	constructor(data: FlashcardIndexQueryResponseEventData) {
		super(FlashcardIndexQueryResponseEvent.type, data);
	}
}

export type FlashcardIndexGetRequestEventData = { id: string };
export class FlashcardIndexGetRequestEvent extends Event<FlashcardIndexGetRequestEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Get:Request';

	constructor(data: FlashcardIndexGetRequestEventData) {
		super(FlashcardIndexGetRequestEvent.type, data);
	}
}

export type FlashcardIndexGetEventData = FlashcardMetadata;
export class FlashcardIndexGetEvent extends Event<FlashcardIndexGetEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Get:Response';

	constructor(data: FlashcardIndexGetEventData) {
		super(FlashcardIndexGetEvent.type, data);
	}
}

export type FlashcardIndexGetAllRequestEventData = undefined;
export class FlashcardIndexGetAllRequestEvent extends Event<FlashcardIndexGetAllRequestEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:GetAll:Request';

	constructor(data: FlashcardIndexGetAllRequestEventData) {
		super(FlashcardIndexGetAllRequestEvent.type, data);
	}
}

export type FlashcardIndexGetAllEventData = FlashcardMetadata[];
export class FlashcardIndexGetAllEvent extends Event<FlashcardIndexGetAllEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:GetAll:Response';

	constructor(data: FlashcardIndexGetAllEventData) {
		super(FlashcardIndexGetAllEvent.type, data);
	}
}

export class FlashcardIndexInitializeRequestEvent extends Event<undefined> {
	static readonly type: IndexEventType = 'Flashcard:Index:Initialize:Request';

	constructor() {
		super(FlashcardIndexInitializeRequestEvent.type, undefined);
	}
}
