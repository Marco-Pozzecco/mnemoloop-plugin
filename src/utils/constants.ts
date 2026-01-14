import { FSRSStats } from '../core/srs/types';
import { ParserSettings } from '../core/parser/types';

export const DEFAULT_FSRS: FSRSStats = {
	stability: 0,
	difficulty: 0,
	elapsed_days: 0,
	scheduled_days: 0,
	learning_steps: 0,
	reps: 0,
	lapses: 0,
	state: 0,
	last_review: null,
	next_review: new Date().toISOString(),
};

export const DEFAULT_PARSER_SETTINGS: ParserSettings = {
	flashcard_directory: '/flashcards/',
	marker: '?',
};

export const VALIDATION_RULES = {
	FSRS_MIN: 0.0,
	FSRS_MAX: 10.0,
	VALID_STATES: [0, 1, 2, 3],
} as const;

export const ERROR_MESSAGES = {
	INVALID_YAML: 'Invalid YAML frontmatter',
	MISSING_MARKER: 'Marker not found in content',
	INVALID_TIMESTAMP: 'Invalid timestamp format',
	INVALID_STATE: 'Invalid FSRS state value',
	OUT_OF_RANGE_PARAM: 'Parameter out of valid range',
	LOCKED_FILE: 'File is locked or read-only',
	CORRUPTED_INDEX: 'Index file is corrupted',
} as const;
