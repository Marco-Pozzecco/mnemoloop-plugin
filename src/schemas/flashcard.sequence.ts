import { z } from 'zod';
import { CardType, FlashcardYamlSchema } from './flashcard';

export const FlashcardSequenceContentSchema = z.object({
	meta_type: z.literal(CardType.Sequence),
	steps: z.array(z.string().min(1)).min(2),
});

export const FlashcardSequenceSchema = FlashcardYamlSchema.extend({
	content: FlashcardSequenceContentSchema,
	card_type: z.literal(CardType.Sequence),
});

export type FlashcardSequenceContent = z.infer<typeof FlashcardSequenceContentSchema>;
export type FlashcardSequenceSchema = z.infer<typeof FlashcardSequenceSchema>;
