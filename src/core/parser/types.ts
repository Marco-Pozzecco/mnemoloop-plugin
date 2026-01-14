export interface ParseResult {
	success: boolean;
	flashcard?: any;
	error?: string;
}

export interface YamlParseResult {
	success: boolean;
	metadata?: any;
	error?: string;
	warnings?: string[];
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

export interface Flashcard {
	uuid: string;
	file: string;
	source: string;
	status: CardStatus;
	created: string;
	updated: string;
	deleted_at: string | null;
	front: string;
	back: string;
	srs: any;
}

export interface FlashcardMetadata {
	uuid: string;
	file: string;
	source: string;
	status: CardStatus;
	created: string;
	updated: string;
	deleted_at: string | null;
	srs: any;
}

export type ValidationError = {
	path: string[];
	message: string;
};

export type FlashcardWithOptionalContent = Omit<Flashcard, 'front' | 'back'> & {
	front?: string;
	back?: string;
};

export interface ParserSettings {
	flashcard_directory: string;
	marker: string;
}

export const DEFAULT_PARSER_SETTINGS: ParserSettings = {
	flashcard_directory: '/flashcards/',
	marker: '?',
};
