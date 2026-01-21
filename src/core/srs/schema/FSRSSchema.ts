import { z } from 'zod';
import { FSRSState, CardRating } from '../utils/types';
import { FlashcardSchema } from '@/core/parser';

export const FSRSParametersSchema = z.object({
	stability: z.number().nonnegative(),
	difficulty: z.number().nonnegative(),
	elapsed_days: z.number().nonnegative(),
	scheduled_days: z.number().nonnegative(),
	learning_steps: z.number().int().nonnegative(),
	reps: z.number().int().nonnegative(),
	lapses: z.number().int().nonnegative(),
	state: z.enum(FSRSState),
	last_review: z.iso.datetime().nullable(),
	next_review: z.iso.datetime(),
});

export const FsrsCalculationInputSchema = z.object({
	current_params: FSRSParametersSchema,
	rating: z.enum(CardRating),
	review_time: z.iso.datetime().optional(),
});

export const FsrsCalculationResultSchema = z.object({
	updated_params: FSRSParametersSchema,
	interval_days: z.number(),
});

export const DueQueueSchema = z.object({
	totalDue: z.number().int().nonnegative(),
	cards: z.array(FlashcardSchema),
});

export const DueQueueFilterSchema = z.object({
	include_stale: z.boolean().optional().default(false),
	include_paused: z.boolean().optional().default(false),
	include_deleted: z.boolean().optional().default(false),
	max_cards: z.number().int().positive().optional(),
});

export type FSRSParameters = z.infer<typeof FSRSParametersSchema>;
export type FsrsCalculationInput = z.infer<typeof FsrsCalculationInputSchema>;
export type FsrsCalculationResult = z.infer<typeof FsrsCalculationResultSchema>;
export type DueQueue = z.infer<typeof DueQueueSchema>;
export type DueQueueFilter = z.infer<typeof DueQueueFilterSchema>;
