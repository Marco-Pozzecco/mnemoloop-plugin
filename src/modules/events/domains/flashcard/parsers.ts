import { IEvent } from '@/interfaces/IEvent';
import { ParseResult } from '@/interfaces/IParser';
import { Flashcard, FlashcardYaml } from '@/schemas';
import { ParserAction } from '@/types/parsers';
import { EventFactory } from '../../core/Event';

type ParserEntities = 'flashcard';
type ParserEventType = `${Capitalize<ParserEntities>}:Parser:${Capitalize<ParserAction>}`;

const t: Record<ParserAction, ParserEventType> = {
	parse: 'Flashcard:Parser:Parse',
	parseContent: 'Flashcard:Parser:ParseContent',
	parseMetadata: 'Flashcard:Parser:ParseMetadata',
	parseAll: 'Flashcard:Parser:ParseAll',
};

type FlashcardParserParseEventData = {
	filepath: string;
};

const FlashcardParserParseRequestEvent = EventFactory.createRequest<FlashcardParserParseEventData>(
	t.parse,
);
type FlashcardParserParseRequestEvent = IEvent<FlashcardParserParseEventData>;

const FlashcardParserParseResponseEvent = EventFactory.createResponse<ParseResult<Flashcard>>(
	t.parse,
);
type FlashcardParserParseResponseEvent = IEvent<ParseResult<Flashcard>>;

type FlashcardParserParseContentEventData = {
	content: string;
};

const FlashcardParserParseContentRequestEvent =
	EventFactory.createRequest<FlashcardParserParseContentEventData>(t.parseContent);
type FlashcardParserParseContentRequestEvent = IEvent<FlashcardParserParseContentEventData>;

const FlashcardParserParseContentResponseEvent = EventFactory.createResponse<
	Omit<ParseResult<Flashcard>, 'filepath' | 'stats'>
>(t.parseContent);
type FlashcardParserParseContentResponseEvent = IEvent<
	Omit<ParseResult<Flashcard>, 'filepath' | 'stats'>
>;

type FlashcardParserParseMetadataEventData = {
	filepath: string;
};

const FlashcardParserParseMetadataRequestEvent =
	EventFactory.createRequest<FlashcardParserParseMetadataEventData>(t.parseMetadata);
type FlashcardParserParseMetadataRequestEvent = IEvent<FlashcardParserParseMetadataEventData>;

const FlashcardParserParseMetadataResponseEvent = EventFactory.createResponse<
	ParseResult<FlashcardYaml>
>(t.parseMetadata);
type FlashcardParserParseMetadataResponseEvent = IEvent<ParseResult<FlashcardYaml>>;

type FlashcardParserParseAllEventData = {
	dirPath: string;
};

const FlashcardParserParseAllRequestEvent =
	EventFactory.createRequest<FlashcardParserParseAllEventData>(t.parseAll);
type FlashcardParserParseAllRequestEvent = IEvent<FlashcardParserParseAllEventData>;

const FlashcardParserParseAllResponseEvent = EventFactory.createResponse<
	ParseResult<FlashcardYaml>[]
>(t.parseAll);
type FlashcardParserParseAllResponseEvent = IEvent<ParseResult<FlashcardYaml>[]>;

export {
	FlashcardParserParseAllRequestEvent,
	FlashcardParserParseAllResponseEvent,
	FlashcardParserParseContentRequestEvent,
	FlashcardParserParseContentResponseEvent,
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
};
