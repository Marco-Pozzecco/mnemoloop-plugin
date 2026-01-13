import { z } from 'zod';
import { FSRSState, CardRating } from '../types';

export const FSRSParametersSchema = z.object({
	stability: z.number().min(0).max(10),
	difficulty: z.number().min(0).max(10),
	state: z.enum(FSRSState),
	last_review: z.iso.datetime().nullable(),
	next_review: z.iso.datetime(),
	reps: z.number().int().nonnegative(),
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
	cards: z.array(z.any()),
});

export const DueQueueFilterSchema = z.object({
	include_stale: z.boolean().optional().default(false),
	include_paused: z.boolean().optional().default(false),
	include_deleted: z.boolean().optional().default(false),
	max_cards: z.number().int().positive().optional(),
});
