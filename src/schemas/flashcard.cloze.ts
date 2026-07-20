import { z } from 'zod';
import { CardType, FlashcardYamlSchema } from './flashcard.utils';

export const FlashcardClozeContentSchema = z.object({
	meta_type: z.literal(CardType.Cloze),
	text: z.string(),
	deletions: z
		.array(
			z.object({
				id: z.string(),
				answer: z.string(),
				hint: z.string().nullable(),
				positions: z.array(z.number().int().min(0)),
			}),
		)
		.min(1),
});

export const FlashcardClozeSchema = FlashcardYamlSchema.extend({
	content: FlashcardClozeContentSchema,
	card_type: z.literal(CardType.Cloze),
});

export type FlashcardClozeContent = z.infer<typeof FlashcardClozeContentSchema>;
export type FlashcardClozeSchema = z.infer<typeof FlashcardClozeSchema>;
