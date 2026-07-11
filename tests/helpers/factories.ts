import { FlashcardMetadata, FlashcardYaml, CardStatus, CardType } from '@/schemas';
import type { FlashcardSequenceSchema } from '@/schemas';
import { DEFAULT_FSRS } from '@/utils/constants';
import { vi } from 'vitest';

const FIXED_DATE_ISO = '2026-05-18T10:00:00.000Z';

/**
 * Create a valid FlashcardMetadata object with all defaults.
 */
export function createFlashcardMetadata(
	overrides: Partial<FlashcardMetadata> = {},
): FlashcardMetadata {
	return {
		...DEFAULT_FSRS,
		uuid: '00000000-0000-0000-0000-000000000000',
		source: null,
		status: CardStatus.ACTIVE,
		decks: [],
		card_type: CardType.Basic,
		file: 'test.md',
		created_at: FIXED_DATE_ISO,
		updated_at: FIXED_DATE_ISO,
		...overrides,
	};
}

/**
 * Create a valid FlashcardYaml object (without file/created_at/updated_at/deleted_at).
 */
export function createFlashcardYaml(overrides: Partial<FlashcardYaml> = {}): FlashcardYaml {
	return {
		...DEFAULT_FSRS,
		uuid: '00000000-0000-0000-0000-000000000000',
		source: null,
		status: CardStatus.ACTIVE,
		decks: [],
		card_type: CardType.Basic,
		...overrides,
	};
}

/**
 * Create a valid FlashcardYaml for a sequence card.
 */
export function createSequenceYaml(overrides: Partial<FlashcardYaml> = {}): FlashcardYaml {
	return createFlashcardYaml({
		card_type: CardType.Sequence,
		...overrides,
	});
}

/**
 * Create a valid Sequence entity.
 */
export function createSequence(overrides: Partial<FlashcardSequenceSchema> = {}): FlashcardSequenceSchema {
	return {
		...DEFAULT_FSRS,
		uuid: '00000000-0000-0000-0000-000000000000',
		source: null,
		status: CardStatus.ACTIVE,
		decks: [],
		card_type: CardType.Sequence,
		content: { meta_type: CardType.Sequence, steps: ['step one', 'step two', 'step three'] },
		...overrides,
	} as FlashcardSequenceSchema;
}

/**
 * Create a mock review item data structure.
 */
export function createMockReviewItem(
	engine?: { schedule: ReturnType<typeof vi.fn> },
	filepath: string = 'test.md',
) {
	return {
		engine: engine || { schedule: vi.fn() },
		filepath,
		data: createFlashcardMetadata({ file: filepath }),
	};
}

/**
 * Create a mock event object conforming to IEvent.
 */
export function createMockEvent(
	type: string = 'test-event',
	data: unknown = {},
): { id: string; type: string; data: unknown } {
	return {
		id: 'evt-test-1234',
		type,
		data,
	};
}
