import { z } from 'zod';

export const DailyProgressSchema = z.object({
	total_count: z.number().int().min(0),
	correct_count: z.number().int().min(0),
	incorrect_count: z.number().int().min(0),
	retention_rate: z.number().min(0).max(1),
	sessions_completed: z.number().int().min(0),
	total_duration: z.number().int().min(0), // seconds
	goal_completed: z.boolean(),
});

export const ProgressSchema = z.record(z.iso.date(), DailyProgressSchema);

export const ReviewSessionSchema = z
	.object({
		session_id: z.uuid(),
		date: z.iso.date(),
		review_type: z.string(),
		start_time: z.number().int().positive(),
		end_time: z.number().int().positive(),
		total_count: z.number().int().min(0),
		correct_count: z.number().int().min(0),
		incorrect_count: z.number().int().min(0),
		duration_s: z.number().int().min(0), // seconds
	})
	.refine((data) => data.end_time >= data.start_time, {
		message: 'end_time must be greater or equal than start_time',
		path: ['end_time'],
	})
	.refine((data) => data.correct_count <= data.total_count, {
		message: 'correct_count must be less than or equal to total_count',
		path: ['correct_count'],
	})
	.refine((data) => data.incorrect_count <= data.total_count, {
		message: 'incorrect_count must be less than or equal to total_count',
		path: ['incorrect_count'],
	});

export const FlashcardStatsSchema = z.object({
	retention_rate: z.number().min(0).max(1),
	difficulty_dist: z.record(z.string(), z.number()),
	current_streak: z.number().int().min(0),
	longest_streak: z.number().int().min(0),
	total_cards: z.number().int().min(0),
	total_learned: z.number().int().min(0),
	total_reviews: z.number().int().min(0),
	due_now: z.number().int().min(0),
	due_today: z.number().int().min(0),
	daily_goal: z.number().int().min(0), // due today cards
	next_review: z.iso.datetime(),
	expected_review_time: z.number().int().nonnegative(),
});

export const StatsSchema = z.object({
	progress: ProgressSchema,
	sessions: z.array(ReviewSessionSchema),
	flashcard: FlashcardStatsSchema,
	updated_at: z.iso.datetime(),
});

export type DailyProgress = z.infer<typeof DailyProgressSchema>;
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type FlashcardStats = z.infer<typeof FlashcardStatsSchema>;

export const DEFAULT_STATISTICS: Stats = {
	progress: {},
	sessions: [],
	updated_at: new Date().toISOString(),
	flashcard: {
		retention_rate: 0,
		difficulty_dist: {},
		total_learned: 0,
		total_cards: 0,
		total_reviews: 0,
		current_streak: 0,
		longest_streak: 0,
		due_now: 0,
		due_today: 0,
		daily_goal: 0,
		expected_review_time: 0,
		next_review: new Date().toISOString(),
	},
};
