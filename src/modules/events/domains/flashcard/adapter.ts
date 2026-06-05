import { FlashcardIndex } from '@/schemas';
import { AdapterAction } from '../settings/adapter';
import { Event } from '../../core';

type Adapters = 'flashcard';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

export class FlashcardAdapterSetEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Set';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterSetEvent.type, data);
	}
}

export class FlashcardAdapterUpdateEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Update';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterUpdateEvent.type, data);
	}
}

export class FlashcardAdapterResetEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Reset';

	constructor() {
		super(FlashcardAdapterResetEvent.type, undefined);
	}
}

export class FlashcardAdapterSaveEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Save';

	constructor() {
		super(FlashcardAdapterSaveEvent.type, undefined);
	}
}

export class FlashcardAdapterInitEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Init';

	constructor() {
		super(FlashcardAdapterInitEvent.type, undefined);
	}
}
