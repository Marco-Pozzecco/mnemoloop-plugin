import { Flashcard, FlashcardYaml } from '@/schemas';
import { Event } from '../core';

export enum ParserAction {
	Parse = 'parse',
	ParseContent = 'parseContent',
	ParseMetadata = 'parseMetadata',
	ParseAll = 'parseAll',
}

type ParserEntities = 'flashcard';
type ParserActionType = 'request' | 'response';
type ParserEventType =
	`${Capitalize<ParserEntities>}:Parser:${Capitalize<ParserAction>}:${Capitalize<ParserActionType>}`;

// Flashcard Parser Request Events
export type FlashcardParserParseRequestData = {
	filepath: string;
};

export class FlashcardParserParseRequestEvent extends Event<FlashcardParserParseRequestData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:Parse:Request';

	constructor(data: FlashcardParserParseRequestData) {
		super(FlashcardParserParseRequestEvent.type, data);
	}
}

export type FlashcardParserParseContentRequestData = {
	content: string;
};

export class FlashcardParserParseContentRequestEvent extends Event<FlashcardParserParseContentRequestData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseContent:Request';

	constructor(data: FlashcardParserParseContentRequestData) {
		super(FlashcardParserParseContentRequestEvent.type, data);
	}
}

export type FlashcardParserParseMetadataRequestData = {
	filepath: string;
};

export class FlashcardParserParseMetadataRequestEvent extends Event<FlashcardParserParseMetadataRequestData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseMetadata:Request';

	constructor(data: FlashcardParserParseMetadataRequestData) {
		super(FlashcardParserParseMetadataRequestEvent.type, data);
	}
}

export type FlashcardParserParseAllRequestData = {
	dirPath: string;
};

export class FlashcardParserParseAllRequestEvent extends Event<FlashcardParserParseAllRequestData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseAll:Request';

	constructor(data: FlashcardParserParseAllRequestData) {
		super(FlashcardParserParseAllRequestEvent.type, data);
	}
}

// Flashcard Parser Response Events
export type FlashcardParserParseResponseData = {
	entity: Flashcard;
	filepath: string;
};

export class FlashcardParserParseResponseEvent extends Event<FlashcardParserParseResponseData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:Parse:Response';

	constructor(data: FlashcardParserParseResponseData) {
		super(FlashcardParserParseResponseEvent.type, data);
	}
}

export type FlashcardParserParseContentResponseData = {
	entity: Flashcard;
};

export class FlashcardParserParseContentResponseEvent extends Event<FlashcardParserParseContentResponseData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseContent:Response';

	constructor(data: FlashcardParserParseContentResponseData) {
		super(FlashcardParserParseContentResponseEvent.type, data);
	}
}

export type FlashcardParserParseMetadataResponseData = {
	entity: FlashcardYaml;
	filepath: string;
};

export class FlashcardParserParseMetadataResponseEvent extends Event<FlashcardParserParseMetadataResponseData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseMetadata:Response';

	constructor(data: FlashcardParserParseMetadataResponseData) {
		super(FlashcardParserParseMetadataResponseEvent.type, data);
	}
}

export type FlashcardParserParseAllResponseData = {
	entities: Array<{
		entity: FlashcardYaml;
		filepath: string;
	}>;
	dirPath: string;
};

export class FlashcardParserParseAllResponseEvent extends Event<FlashcardParserParseAllResponseData> {
	static readonly type: ParserEventType = 'Flashcard:Parser:ParseAll:Response';

	constructor(data: FlashcardParserParseAllResponseData) {
		super(FlashcardParserParseAllResponseEvent.type, data);
	}
}
