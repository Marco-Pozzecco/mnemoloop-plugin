import { Flashcard, FlashcardContent, FlashcardYaml } from '@/schemas';
import { Event } from '../core';

type Writers = 'flashcard';
type WriterAction = 'create' | 'update' | 'fm' | 'body' | 'delete';
type IOAction = 'request' | 'response';
type WriterEventType =
	`${Capitalize<Writers>}:Writer:${Capitalize<WriterAction>}:${Capitalize<IOAction>}`;

// Flashcard Writer Events
type FlashcardCreateRequestData = Pick<Flashcard, 'front' | 'back' | 'source'>;

export class FlashcardWriterCreateRequestEvent extends Event<FlashcardCreateRequestData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Create:Request';

	constructor(data: FlashcardCreateRequestData) {
		super(FlashcardWriterCreateRequestEvent.type, data);
	}
}

type FlashcardCreateResponseData = Pick<Flashcard, 'uuid' | 'source'> & {
	filepath: string;
	request_id: string;
};

export class FlashcardWriterCreateResponseEvent extends Event<FlashcardCreateResponseData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Create:Response';

	constructor(data: FlashcardCreateResponseData) {
		super(FlashcardWriterCreateResponseEvent.type, data);
	}
}

type FlashcardUpdateRequestData = Pick<Flashcard, 'uuid' | 'front' | 'back' | 'source'>;

export class FlashcardWriterUpdateRequestEvent extends Event<FlashcardUpdateRequestData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Update:Request';

	constructor(data: FlashcardUpdateRequestData) {
		super(FlashcardWriterUpdateRequestEvent.type, data);
	}
}

type FlashcardUpdateResponseData = Pick<Flashcard, 'uuid' | 'source'> & { filepath: string };

export class FlashcardWriterUpdateResponseEvent extends Event<FlashcardUpdateResponseData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Update:Response';

	constructor(data: FlashcardUpdateResponseData) {
		super(FlashcardWriterUpdateResponseEvent.type, data);
	}
}

type FlashcardDeleteRequestData = Pick<Flashcard, 'uuid'>;

export class FlashcardWriterDeleteRequestEvent extends Event<FlashcardDeleteRequestData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Delete:Request';

	constructor(data: FlashcardDeleteRequestData) {
		super(FlashcardWriterDeleteRequestEvent.type, data);
	}
}

type FlashcardDeleteResponseData = Pick<Flashcard, 'uuid'> & { filepath: string };

export class FlashcardWriterDeleteResponseEvent extends Event<FlashcardDeleteResponseData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Delete:Response';

	constructor(data: FlashcardDeleteResponseData) {
		super(FlashcardWriterDeleteResponseEvent.type, data);
	}
}

type FlashcardWriterFmRequestData = Partial<FlashcardYaml>;

export class FlashcardWriterFmRequestEvent extends Event<FlashcardWriterFmRequestData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Fm:Request';

	constructor(data: FlashcardWriterFmRequestData) {
		super(FlashcardWriterFmRequestEvent.type, data);
	}
}

type FlashcardWriterFmResponseData = FlashcardYaml;

export class FlashcardWriterFmResponseEvent extends Event<FlashcardWriterFmResponseData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Fm:Response';

	constructor(data: FlashcardWriterFmResponseData) {
		super(FlashcardWriterFmResponseEvent.type, data);
	}
}

type FlashcardWriterBodyRequestData = FlashcardContent;

export class FlashcardWriterBodyRequestEvent extends Event<FlashcardWriterBodyRequestData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Body:Request';

	constructor(data: FlashcardWriterBodyRequestData) {
		super(FlashcardWriterBodyRequestEvent.type, data);
	}
}

type FlashcardWriterBodyResponseData = FlashcardContent;

export class FlashcardWriterBodyResponseEvent extends Event<FlashcardWriterBodyResponseData> {
	static readonly type: WriterEventType = 'Flashcard:Writer:Body:Response';

	constructor(data: FlashcardWriterBodyResponseData) {
		super(FlashcardWriterBodyResponseEvent.type, data);
	}
}
