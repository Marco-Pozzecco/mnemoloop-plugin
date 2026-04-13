import { FlashcardParser } from '@/modules/parsers/FlashcardParser';

export enum ParserKey {
	flashcard = 'flashcard',
}

interface ParserMap {
	[ParserKey.flashcard]: FlashcardParser;
}

export type Parsers = Map<ParserKey, ParserMap[ParserKey]>;
