import { z } from 'zod';
import { CardType, FlashcardYamlSchema } from './flashcard.utils';

export const FlashcardQuizContentSchema = z
	.object({
		meta_type: z.literal(CardType.Quiz),
		question: z.string(),
		options: z.array(z.string().min(1)).min(2),
		correct_index: z.number().int().min(0),
	})
	.refine((data) => data.correct_index < data.options.length, {
		message: 'correct_index must be a valid index into options',
	});

export const FlashcardQuizSchema = FlashcardYamlSchema.extend({
	content: FlashcardQuizContentSchema,
	card_type: z.literal(CardType.Quiz),
});

export type FlashcardQuizContent = z.infer<typeof FlashcardQuizContentSchema>;
export type FlashcardQuizSchema = z.infer<typeof FlashcardQuizSchema>;
