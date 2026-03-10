import { z } from 'zod';
import { State, Rating } from 'ts-fsrs';
import type { Flashcard } from './flashcard';

export const FSRSParams = z.object({
	stability: z.number().nonnegative(),
	difficulty: z.number().nonnegative(),
	elapsed_days: z.number().nonnegative(),
	scheduled_days: z.number().nonnegative(),
	learning_steps: z.number().int().nonnegative(),
	reps: z.number().int().nonnegative(),
	lapses: z.number().int().nonnegative(),
	state: z.enum(State),
	last_review: z.iso.datetime().nullable(),
	next_review: z.iso.datetime(),
});

export const FsrsCalculationInputSchema = z.object({
	current_params: FSRSParams,
	rating: z.enum(Rating).exclude(['Manual']),
	review_time: z.iso.datetime().optional(),
});

export const FsrsCalculationResultSchema = z.object({
	updated_params: FSRSParams,
	interval_days: z.number(),
});

export const DueQueueSchema = z.object({
	totalDue: z.number().int().nonnegative(),
	cards: z.array(z.any()) as z.ZodArray<z.ZodType<Flashcard>>,
});

export const DueQueueFilterSchema = z.object({
	include_stale: z.boolean().optional().default(false),
	include_paused: z.boolean().optional().default(false),
	include_deleted: z.boolean().optional().default(false),
	max_cards: z.number().int().positive().optional(),
});

export type FSRSState = State;
export const FSRSState = State;

export type FSRSParams = z.infer<typeof FSRSParams>;

export type FsrsCalculationInput = z.infer<typeof FsrsCalculationInputSchema>;

export type FSRSRating = FsrsCalculationInput['rating'];
export const FSRSRating = Rating;

export type FsrsCalculationResult = z.infer<typeof FsrsCalculationResultSchema>;

export type DueQueue = z.infer<typeof DueQueueSchema>;

export type DueQueueFilter = z.infer<typeof DueQueueFilterSchema>;

export const DEFAULT_DUE_QUEUE_FILTER: DueQueueFilter = {
	include_deleted: false,
	include_paused: false,
	include_stale: false,
};
