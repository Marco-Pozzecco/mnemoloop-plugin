import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';

export enum ParserKey {
	flashcard = 'flashcard',
}

interface ParserMap {
	[ParserKey.flashcard]: FlashcardParser;
}

export type Parsers = Map<ParserKey, ParserMap[ParserKey]>;

export enum ParserAction {
	Parse = 'parse',
	ParseContent = 'parseContent',
	ParseMetadata = 'parseMetadata',
	ParseAll = 'parseAll',
}
