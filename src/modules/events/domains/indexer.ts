import { FlashcardMetadata } from '@/schemas';
import { Event } from '../core/Event';

// Re-export IndexKey for consumers
export { IndexKey } from '@/types/indexes';

export enum IndexAction {
	Create = 'create',
	Delete = 'delete',
	Initialize = 'initialize',
	Save = 'save',
	Update = 'update',
	Recalc = 'recalc',
}

type IndexEntities = 'flashcard';
type ReqRes = 'request' | 'response';
type IndexEventType =
	`${Capitalize<IndexEntities>}:Index:${Capitalize<IndexAction>}:${Capitalize<ReqRes>}`;

export type FlashcardIndexEventData = { flashcards: FlashcardMetadata[]; total: number };

export class FlashcardIndexCreateEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Create:Response';

	constructor(data: FlashcardIndexEventData) {
		super(FlashcardIndexCreateEvent.type, data);
	}
}

export class FlashcardIndexDeleteEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Delete:Response';

	constructor(data: FlashcardIndexEventData) {
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

export class FlashcardIndexUpdateEvent extends Event<FlashcardIndexEventData> {
	static readonly type: IndexEventType = 'Flashcard:Index:Update:Response';

	constructor(data: FlashcardIndexEventData) {
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
