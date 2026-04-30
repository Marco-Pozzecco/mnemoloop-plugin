import { z } from 'zod';
import { FlashcardMetadataSchema } from './flashcard';

export const IndexSchema = z.object({
	version: z.number().int().positive(),
	last_updated: z.iso.datetime(),
	cards: z.record(z.string(), FlashcardMetadataSchema),
});

export type Index = z.infer<typeof IndexSchema>;
