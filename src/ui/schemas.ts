import { z } from 'zod';

/**
 * Validates FSRS ratings (1-4 for Again, Hard, Good, Easy).
 */
export const ReviewRatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

/**
 * Validates dashboard configuration preferences.
 */
export const DashboardConfigSchema = z.object({
	dailyGoal: z.number().int().positive().default(20),
	showProgressChart: z.boolean().default(true),
	showRetentionRate: z.boolean().default(true),
	chartTimeframe: z.enum(['week', 'month', 'year']).default('week'),
});

/**
 * Validates touch gesture data for mobile interactions.
 */
export const GestureSchema = z.object({
	type: z.enum(['swipe', 'tap', 'hold']),
	direction: z.enum(['left', 'right', 'up', 'down']).optional(),
	distance: z.number().nonnegative().optional(),
	velocity: z.number().nonnegative().optional(),
});

/**
 * Validates the reactive state of the dashboard.
 */
export const DashboardStateSchema = z.object({
	totalCards: z.number().int().nonnegative(),
	retentionRate: z.number().min(0).max(1),
	dueCount: z.number().int().nonnegative(),
	dailyGoal: z.number().int().positive(),
	progressData: z.array(
		z.object({
			date: z.string(),
			completed: z.number().int().nonnegative(),
			target: z.number().int().nonnegative(),
		}),
	),
});

/**
 * Validates a UI notification.
 */
export const NotificationSchema = z.object({
	id: z.string().uuid(),
	type: z.enum(['info', 'success', 'warning', 'error']),
	message: z.string().min(1),
	duration: z.number().positive().optional(),
});

/**
 * Validates a review session state.
 */
export const ReviewSessionSchema = z.object({
	sessionId: z.string().uuid(),
	queue: z.array(z.any()),
	currentIndex: z.number().int().nonnegative(),
	startTime: z.string().datetime(),
	isComplete: z.boolean(),
	stats: z.object({
		correct: z.number().int().nonnegative(),
		incorrect: z.number().int().nonnegative(),
		total: z.number().int().nonnegative(),
	}),
});

/**
 * Type inferences from schemas.
 */
export type ReviewRating = z.infer<typeof ReviewRatingSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type Gesture = z.infer<typeof GestureSchema>;
export type DashboardState = z.infer<typeof DashboardStateSchema>;
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
