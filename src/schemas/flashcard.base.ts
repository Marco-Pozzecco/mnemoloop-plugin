import { z } from 'zod';
import { CardType, FlashcardYamlSchema } from './flashcard.utils';

export const FlashcardBaseContentSchema = z.object({
	meta_type: z.literal(CardType.Basic),
	front: z.string(),
	back: z.string(),
});

export const FlashcardBaseSchema = FlashcardYamlSchema.extend({
	content: FlashcardBaseContentSchema,
	card_type: z.literal(CardType.Basic),
});

export type FlashcardBaseContent = z.infer<typeof FlashcardBaseContentSchema>;
export type FlashcardBaseSchema = z.infer<typeof FlashcardBaseSchema>;
