import { Event } from '../../core/Event';

export enum ParserAction {
	Parse = 'parse',
	ParseContent = 'parseContent',
	ParseMetadata = 'parseMetadata',
	ParseAll = 'parseAll',
}

type ParserEntities = 'flashcard';
type ParserEventType = `${Capitalize<ParserEntities>}:Parser:${Capitalize<ParserAction>}`;

// Flashcard Parser Action Events
export type FlashcardParserParseEventData = {
	filepath: string;
};

export class FlashcardParserParseEvent extends Event<FlashcardParserParseEventData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:Parse';

	constructor(data: FlashcardParserParseEventData) {
		super(FlashcardParserParseEvent.type, data);
	}
}

export type FlashcardParserParseContentEventData = {
	content: string;
};

export class FlashcardParserParseContentEvent extends Event<FlashcardParserParseContentEventData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseContent';

	constructor(data: FlashcardParserParseContentEventData) {
		super(FlashcardParserParseContentEvent.type, data);
	}
}

export type FlashcardParserParseMetadataEventData = {
	filepath: string;
};

export class FlashcardParserParseMetadataEvent extends Event<FlashcardParserParseMetadataEventData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseMetadata';

	constructor(data: FlashcardParserParseMetadataEventData) {
		super(FlashcardParserParseMetadataEvent.type, data);
	}
}

export type FlashcardParserParseAllEventData = {
	dirPath: string;
};

export class FlashcardParserParseAllEvent extends Event<FlashcardParserParseAllEventData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseAll';

	constructor(data: FlashcardParserParseAllEventData) {
		super(FlashcardParserParseAllEvent.type, data);
	}
}
