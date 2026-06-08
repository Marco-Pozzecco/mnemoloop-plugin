import { ParseResult } from '@/interfaces/IParser';
import { Flashcard, FlashcardYaml } from '@/schemas';
import { ParserAction } from '@/types/parsers';
import { EventRequest, EventResponse } from '../../core/Event';

type ParserEntities = 'flashcard';
type ParserEventType = `${Capitalize<ParserEntities>}:Parser:${Capitalize<ParserAction>}`;

const t: Record<ParserAction, ParserEventType> = {
	parse: 'Flashcard:Parser:Parse',
	parseContent: 'Flashcard:Parser:ParseContent',
	parseMetadata: 'Flashcard:Parser:ParseMetadata',
	parseAll: 'Flashcard:Parser:ParseAll',
};

// Flashcard Parser Action Events
export type FlashcardParserParseEventData = {
	filepath: string;
};

export class FlashcardParserParseRequestEvent extends EventRequest<FlashcardParserParseEventData> {
	constructor(data: FlashcardParserParseEventData) {
		super(t.parse, data);
	}
}

export class FlashcardParserParseResponseEvent extends EventResponse<ParseResult<Flashcard>> {
	constructor(data: ParseResult<Flashcard>) {
		super(t.parse, data);
	}
}

export type FlashcardParserParseContentEventData = {
	content: string;
};

export class FlashcardParserParseContentRequestEvent extends EventRequest<FlashcardParserParseContentEventData> {
	constructor(data: FlashcardParserParseContentEventData) {
		super(t.parseContent, data);
	}
}

export class FlashcardParserParseContentResponseEvent extends EventResponse<
	Omit<ParseResult<Flashcard>, 'filepath'>
> {
	constructor(data: Omit<ParseResult<Flashcard>, 'filepath'>) {
		super(t.parseContent, data);
	}
}

export type FlashcardParserParseMetadataEventData = {
	filepath: string;
};

export class FlashcardParserParseMetadataRequestEvent extends EventRequest<FlashcardParserParseMetadataEventData> {
	constructor(data: FlashcardParserParseMetadataEventData) {
		super(t.parseMetadata, data);
	}
}

export class FlashcardParserParseMetadataResponseEvent extends EventResponse<
	ParseResult<FlashcardYaml>
> {
	constructor(data: ParseResult<FlashcardYaml>) {
		super(t.parseMetadata, data);
	}
}

export type FlashcardParserParseAllEventData = {
	dirPath: string;
};

export class FlashcardParserParseAllRequestEvent extends EventRequest<FlashcardParserParseAllEventData> {
	constructor(data: FlashcardParserParseAllEventData) {
		super(t.parseAll, data);
	}
}

export class FlashcardParserParseAllResponseEvent extends EventResponse<
	ParseResult<FlashcardYaml>[]
> {
	constructor(data: ParseResult<FlashcardYaml>[]) {
		super(t.parseAll, data);
	}
}
