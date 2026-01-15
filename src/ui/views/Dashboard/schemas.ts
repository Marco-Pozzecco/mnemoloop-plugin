import { z } from 'zod';

/**
 * Schema for validating a single progress entry.
 */
export const ProgressEntrySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
	completed: z.number().int().nonnegative(),
	target: z.number().int().nonnegative(),
	newCards: z.number().int().nonnegative(),
	retention: z.number().min(0).max(1),
});

/**
 * Schema for validating aggregated dashboard statistics.
 */
export const DashboardStatsSchema = z.object({
	totalCards: z.number().int().nonnegative(),
	retentionRate: z.number().min(0).max(1),
	dueCount: z.number().int().nonnegative(),
	dailyGoal: z.number().int().positive(),
	streakDays: z.number().int().nonnegative(),
	cardsLearnedToday: z.number().int().nonnegative(),
	estimatedTimeMinutes: z.number().int().nonnegative(),
	progressData: z.array(ProgressEntrySchema),
});

/**
 * Schema for validating dashboard configuration preferences.
 */
export const DashboardConfigSchema = z.object({
	dailyGoal: z.number().int().positive().default(20),
	showProgressChart: z.boolean().default(true),
	showRetentionRate: z.boolean().default(true),
	chartTimeframe: z.enum(['week', 'month', 'year']).default('week'),
	preferredChartType: z.enum(['bar', 'line']).default('bar'),
});

/**
 * Schema for validating trend information in stats cards.
 */
export const StatsTrendSchema = z.object({
	value: z.number(),
	isPositive: z.boolean(),
});

/**
 * Schema for validating stats card properties.
 */
export const StatsCardPropsSchema = z.object({
	label: z.string().min(1),
	value: z.union([z.string(), z.number()]),
	icon: z.string().optional(),
	trend: StatsTrendSchema.optional(),
	description: z.string().optional(),
});

/**
 * Type inferences from schemas for runtime validation.
 */
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type StatsTrend = z.infer<typeof StatsTrendSchema>;
