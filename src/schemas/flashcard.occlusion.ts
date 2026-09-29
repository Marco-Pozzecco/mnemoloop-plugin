import { z } from 'zod';
import { CardType, FlashcardYamlSchema } from './flashcard.utils';

/** A normalized coordinate: a fraction of the image's width or height, in `0..1`. */
export const OcclusionFractionSchema = z.number().min(0).max(1);

export const FlashcardOcclusionMaskSchema = z.object({
	id: z.string(),
	rect: z.tuple([
		OcclusionFractionSchema,
		OcclusionFractionSchema,
		OcclusionFractionSchema,
		OcclusionFractionSchema,
	]),
	answer: z.string().min(1),
	hint: z.string().nullable(),
});

export const FlashcardOcclusionContentSchema = z.object({
	meta_type: z.literal(CardType.Occlusion),
	image: z.string().min(1),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	masks: z.array(FlashcardOcclusionMaskSchema).min(1),
});

export const FlashcardOcclusionSchema = FlashcardYamlSchema.extend({
	content: FlashcardOcclusionContentSchema,
	card_type: z.literal(CardType.Occlusion),
});

export type FlashcardOcclusionMask = z.infer<typeof FlashcardOcclusionMaskSchema>;
export type FlashcardOcclusionContent = z.infer<typeof FlashcardOcclusionContentSchema>;
export type FlashcardOcclusionSchema = z.infer<typeof FlashcardOcclusionSchema>;
