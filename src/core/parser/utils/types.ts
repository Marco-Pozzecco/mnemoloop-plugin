import { FlashcardMetadata } from '@/core/indexer';

export type ParseResult = ParseResultSuccess | ParseResultError;

interface ParseResultSuccess {
	success: true;
	flashcard: Flashcard;
	error: undefined;
}

interface ParseResultError {
	success: false;
	flashcard: undefined;
	error: string;
}

export type YamlParseResult = YamlParseResultSuccess | YamlParseResultError;

interface YamlParseResultSuccess {
	success: true;
	metadata: FlashcardMetadata;
	error: undefined;
	warnings: string[];
}

interface YamlParseResultError {
	success: false;
	metadata: undefined;
	error: string;
	warnings: undefined;
}

export interface ContentSplitResult {
	success: boolean;
	front?: string;
	back?: string;
	error?: string;
}

export enum CardStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
	PAUSED = 'PAUSED',
	STALE = 'STALE',
}

export interface Flashcard extends FlashcardMetadata {
	front: string;
	back: string;
}

export type ValidationError = {
	path: string[];
	message: string;
};

export interface ParserSettings {
	flashcard_directory: string;
	marker: string;
}

export const DEFAULT_PARSER_SETTINGS: ParserSettings = {
	flashcard_directory: '/flashcards/',
	marker: '?',
};
