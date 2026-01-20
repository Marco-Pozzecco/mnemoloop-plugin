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
	last_updated: z.iso.datetime(),
	history: z.record(z.iso.datetime('YY-MM-DD'), z.any()),
});

export type StatisticsSummary = z.infer<typeof StatisticsSummarySchema>;
export type Stats = z.infer<typeof StatsSchema>;
