import { z } from 'zod';
import { FSRSState, CardRating } from '../types';

export const FSRSParametersSchema = z.object({
	stability: z.number().nonnegative(),
	difficulty: z.number().nonnegative(),
	elapsed_days: z.number().nonnegative(),
	scheduled_days: z.number().nonnegative(),
	learning_steps: z.number().int().nonnegative(),
	reps: z.number().int().nonnegative(),
	lapses: z.number().int().nonnegative(),
	state: z.nativeEnum(FSRSState),
	last_review: z.string().datetime().nullable(),
	next_review: z.string().datetime(),
});

export const FsrsCalculationInputSchema = z.object({
	current_params: FSRSParametersSchema,
	rating: z.nativeEnum(CardRating),
	review_time: z.string().datetime().optional(),
});

export const FsrsCalculationResultSchema = z.object({
	updated_params: FSRSParametersSchema,
	interval_days: z.number(),
});

export const DueQueueSchema = z.object({
	totalDue: z.number().int().nonnegative(),
	cards: z.array(z.any()),
});

export const DueQueueFilterSchema = z.object({
	include_stale: z.boolean().optional().default(false),
	include_paused: z.boolean().optional().default(false),
	include_deleted: z.boolean().optional().default(false),
	max_cards: z.number().int().positive().optional(),
});
