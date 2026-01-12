import { z } from 'zod';

export const StatisticsSummarySchema = z.object({
	retention_rate: z.number().min(0).max(1),
	difficulty_dist: z.record(z.string(), z.number()),
	total_learned: z.number().int().min(0),
	due_today: z.number().int().min(0),
});

export const StatsSchema = z.object({
	version: z.number().int().positive(),
	summary: StatisticsSummarySchema,
	last_updated: z.string().datetime(),
});

export type StatisticsSummary = z.infer<typeof StatisticsSummarySchema>;
export type Stats = z.infer<typeof StatsSchema>;
