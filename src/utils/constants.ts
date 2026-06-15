import type { FSRSParams } from '@/schemas';
import { State } from 'ts-fsrs';

export const DEFAULT_FSRS: FSRSParams = {
	stability: 0,
	difficulty: 0,
	scheduled_days: 0,
	learning_steps: 0,
	reps: 0,
	lapses: 0,
	state: State.New,
	last_review: null,
	due: new Date().toISOString(),
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
	FILE_NOT_FOUND: 'Flashcard file not found',
	INDEX_NOT_FOUND: 'Flashcard index not found',
	SYNC_FAILED: 'Synchronization failed',
	RECOVERY_FAILED: 'Index recovery failed',
	PARSER_ERROR: 'Error parsing flashcard content',
	CALCULATION_ERROR: 'Error in FSRS calculation',
} as const;

export { DEFAULT_STATISTICS } from '@/schemas/statistics';
