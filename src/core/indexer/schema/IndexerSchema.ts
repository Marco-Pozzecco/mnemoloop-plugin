import { CardStatus } from '@/core/parser';
import { FSRSParametersSchema } from '@/core/srs';
import { z } from 'zod';

export const FlashcardMetadataSchema = z.object({
	uuid: z.uuid(),
	file: z.string().min(1),
	source: z
		.string()
		.regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format')
		.nullable(),
	status: z.enum(CardStatus),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
	deleted_at: z.iso.datetime().nullable(),
	srs: FSRSParametersSchema,
});

export const IndexSchema = z.object({
	version: z.number().int().positive(),
	last_updated: z.iso.datetime(),
	cards: z.record(z.string(), FlashcardMetadataSchema),
});

export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type Index = z.infer<typeof IndexSchema>;
