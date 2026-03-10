import { z } from 'zod';

export const SessionCardSchema = z.object({
	cardId: z.string(),
	rating: z.number().int().min(1).max(4),
	oldState: z.enum(['New', 'Learning', 'Review', 'Relearning']),
	newState: z.enum(['New', 'Learning', 'Review', 'Relearning']),
	oldStability: z.number().min(0),
	newStability: z.number().min(0),
	oldDifficulty: z.number().min(0).max(10),
	newDifficulty: z.number().min(0).max(10),
});

export const ReviewSessionSchema = z
	.object({
		sessionId: z.uuid(),
		startTime: z.number().int().positive(),
		endTime: z.number().int().positive(),
		cardsReviewed: z.number().int().min(0),
		correctCount: z.number().int().min(0),
		incorrectCount: z.number().int().min(0),
		duration: z.number().int().min(0),
		cards: z.array(SessionCardSchema),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	})
	.refine((data) => data.endTime >= data.startTime, {
		message: 'endTime must be greater or equal than startTime',
		path: ['endTime'],
	})
	.refine((data) => data.correctCount <= data.cardsReviewed, {
		message: 'correctCount must be less than or equal to cardsReviewed',
		path: ['correctCount'],
	})
	.refine((data) => data.incorrectCount <= data.cardsReviewed, {
		message: 'incorrectCount must be less than or equal to cardsReviewed',
		path: ['incorrectCount'],
	});

export const DailyProgressSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	cardsReviewed: z.number().int().min(0),
	correctCount: z.number().int().min(0),
	incorrectCount: z.number().int().min(0),
	retentionRate: z.number().min(0).max(1),
	sessionsCompleted: z.number().int().min(0),
	totalDuration: z.number().int().min(0),
	goalCompleted: z.boolean(),
});

export const ReviewContextSchema = z.object({
	currentSessionId: z.string().uuid(),
	currentCardIndex: z.number().int().min(0),
	queueSize: z.number().int().min(0),
	sessionStartTime: z.number().int().positive(),
});

export const DashboardContextSchema = z.object({
	selectedPeriod: z.enum(['today', '7days', '30days']),
	showDetails: z.boolean(),
});

export const NavigationStateSchema = z.object({
	currentView: z.enum(['dashboard', 'review']),
	reviewContext: ReviewContextSchema.nullable(),
	dashboardContext: DashboardContextSchema.nullable(),
});

export const StatisticsSummarySchema = z.object({
	retention_rate: z.number().min(0).max(1),
	difficulty_dist: z.record(z.string(), z.number()),
	total_learned: z.number().int().min(0),
	due_today: z.number().int().min(0),
});

export const StatsSchema = z.object({
	version: z.number().int(),
	summary: StatisticsSummarySchema,
	last_updated: z.iso.datetime(),
	history: z.array(ReviewSessionSchema),
	current_streak: z.number().int().min(0),
	longest_streak: z.number().int().min(0),
	daily_goal: z.number().int(),
	progress: z.array(DailyProgressSchema).max(30),
	total_cards: z.number().int().min(0),
});

export type SessionCard = z.infer<typeof SessionCardSchema>;
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;
export type DailyProgress = z.infer<typeof DailyProgressSchema>;
export type ReviewContext = z.infer<typeof ReviewContextSchema>;
export type DashboardContext = z.infer<typeof DashboardContextSchema>;
export type NavigationState = z.infer<typeof NavigationStateSchema>;
export type StatisticsSummary = z.infer<typeof StatisticsSummarySchema>;
export type Stats = z.infer<typeof StatsSchema>;
