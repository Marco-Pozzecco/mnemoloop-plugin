import { IParser } from '@/interfaces/IParser';
import { Flashcard, FlashcardMetadata } from '@/schemas';

export enum ParserKey {
	flashcard = 'flashcard',
}

interface ParserMap {
	[ParserKey.flashcard]: IParser<Flashcard, FlashcardMetadata>;
}

export type Parsers = Map<ParserKey, ParserMap[ParserKey]>;
