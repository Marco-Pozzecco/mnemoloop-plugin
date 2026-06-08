import { FlashcardIndex } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { Event, EventRequest, EventResponse } from '../../core';

type Adapters = 'flashcard';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	set: 'Flashcard:Adapter:Set',
	update: 'Flashcard:Adapter:Update',
	reset: 'Flashcard:Adapter:Reset',
	save: 'Flashcard:Adapter:Save',
	init: 'Flashcard:Adapter:Init',
};

export class FlashcardAdapterSetRequestEvent extends EventRequest<FlashcardIndex> {
	constructor(data: FlashcardIndex) {
		super(t.set, data);
	}
}

export class FlashcardAdapterSetResponseEvent extends EventResponse<FlashcardIndex> {
	constructor(data: FlashcardIndex) {
		super(t.set, data);
	}
}

export class FlashcardAdapterUpdateRequestEvent extends EventRequest<FlashcardIndex> {
	constructor(data: FlashcardIndex) {
		super(t.update, data);
	}
}

export class FlashcardAdapterUpdateResponseEvent extends EventResponse<FlashcardIndex> {
	constructor(data: FlashcardIndex) {
		super(t.update, data);
	}
}

export class FlashcardAdapterResetEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Reset';

	constructor() {
		super(t.reset, undefined);
	}
}

export class FlashcardAdapterSaveEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Save';

	constructor() {
		super(t.save, undefined);
	}
}

export class FlashcardAdapterInitEvent extends Event<undefined> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Init';

	constructor() {
		super(t.init, undefined);
	}
}
