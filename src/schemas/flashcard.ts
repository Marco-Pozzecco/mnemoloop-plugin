import { DEFAULT_FSRS } from '@/utils/constants';
import { z } from 'zod';
import { FSRSParams } from './srs';

export enum CardStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
	PAUSED = 'PAUSED',
	STALE = 'STALE',
}

export const FlashcardYamlSchema = FSRSParams.extend({
	uuid: z.uuid(),
	source: z
		.string()
		.regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format')
		.nullable(),
	status: z.enum(CardStatus),
});

export const FlashcardMetadataSchema = FlashcardYamlSchema.extend({
	file: z.string().min(1),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
});

export const FlashcardContentSchema = z.object({
	front: z.string(),
	back: z.string(),
});

export const FlashcardSchema = FlashcardYamlSchema.extend(FlashcardContentSchema.shape);

export const FlashcardIndexSchema = z.object({
	flashcards: z.array(FlashcardMetadataSchema),
	updated_at: z.iso.datetime().nullable(),
});

export type FlashcardIndex = z.infer<typeof FlashcardIndexSchema>;
export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type FlashcardYaml = z.infer<typeof FlashcardYamlSchema>;
export type FlashcardContent = z.infer<typeof FlashcardContentSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const DEFAULT_FLASHCARD_YAML: Omit<FlashcardYaml, 'uuid'> = {
	...DEFAULT_FSRS,
	source: null,
	status: CardStatus.ACTIVE,
};

export const DEFAULT_FLASHCARD_METADATA: Omit<FlashcardMetadata, 'uuid' | 'file'> = {
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	deleted_at: null,
	...DEFAULT_FSRS,
	...DEFAULT_FLASHCARD_YAML,
};

export const DEFAULT_FLASHCARD_INDEX: FlashcardIndex = {
	flashcards: [],
	updated_at: null,
};
