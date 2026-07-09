import { DEFAULT_FSRS } from '@/utils/constants';
import { z } from 'zod';
import { FSRSParams } from './srs';
import {
	FlashcardSequenceContent,
	FlashcardSequenceContentSchema,
	FlashcardSequenceSchema,
} from './flashcard.sequence';
import {
	FlashcardBaseContent,
	FlashcardBaseContentSchema,
	FlashcardBaseSchema,
} from './flashcard.base';

export enum CardType {
	Basic = 'basic',
	Sequence = 'sequence',
}

export enum CardStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
	PAUSED = 'PAUSED',
	STALE = 'STALE',
}

export const CardTypeSchema = z.enum([CardType.Basic, CardType.Sequence]);

export const FlashcardYamlSchema = FSRSParams.extend({
	uuid: z.uuid(),
	source: z
		.string()
		.regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format')
		.nullable(),
	status: z.enum(CardStatus),
	decks: z.array(z.string()),
	card_type: CardTypeSchema.default(CardType.Basic),
});

export const FlashcardContentSchema = z.union([
	FlashcardBaseContentSchema,
	FlashcardSequenceContentSchema,
]);

export const FlashcardMetadataSchema = FlashcardYamlSchema.extend({
	file: z.string().min(1),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
});

export const FlashcardIndexSchema = z.object({
	flashcards: z.array(FlashcardMetadataSchema),
	updated_at: z.iso.datetime().nullable(),
});

export type FlashcardIndex = z.infer<typeof FlashcardIndexSchema>;
export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type FlashcardYaml = z.infer<typeof FlashcardYamlSchema>;
export type Flashcard = FlashcardBaseSchema | FlashcardSequenceSchema;
export type FlashcardContent = FlashcardBaseContent | FlashcardSequenceContent;

export const DEFAULT_FLASHCARD_YAML: Omit<FlashcardYaml, 'uuid'> = {
	...DEFAULT_FSRS,
	source: null,
	status: CardStatus.ACTIVE,
	decks: [],
	card_type: CardType.Basic,
};

export const DEFAULT_FLASHCARD_METADATA: Omit<FlashcardMetadata, 'uuid' | 'file'> = {
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...DEFAULT_FSRS,
	...DEFAULT_FLASHCARD_YAML,
	card_type: CardType.Basic,
};

export const DEFAULT_FLASHCARD_INDEX: FlashcardIndex = {
	flashcards: [],
	updated_at: null,
};
