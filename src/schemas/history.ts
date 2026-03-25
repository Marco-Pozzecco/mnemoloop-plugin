import { Rating, State } from "ts-fsrs";
import z from "zod";

export const DailyProgressSchema = z.object({
  date: z.iso.date(),
  cards_reviewed: z.number().int().min(0),
  correct_count: z.number().int().min(0),
  incorrect_count: z.number().int().min(0),
  retention_rate: z.number().min(0).max(1),
  sessions_completed: z.number().int().min(0),
  total_duration: z.number().int().min(0),
  goal_completed: z.boolean(),
});

export const SessionCardSchema = z.object({
  card_id: z.string(),
  rating: z.enum(Rating).exclude(["Manual"]),
  old_state: z.enum(State),
  new_state: z.enum(State),
  old_stability: z.number().nonnegative(),
  new_stability: z.number().nonnegative(),
  old_difficulty: z.number().nonnegative(),
  new_difficulty: z.number().nonnegative(),
});

export const ReviewSessionSchema = z
  .object({
    session_id: z.uuid(),
    date: z.iso.date(),
    start_time: z.number().int().positive(),
    end_time: z.number().int().positive(),
    cards_reviewed: z.number().int().min(0),
    correct_count: z.number().int().min(0),
    incorrect_count: z.number().int().min(0),
    duration: z.number().int().min(0),
    cards: z.array(SessionCardSchema),
  })
  .refine((data) => data.end_time >= data.start_time, {
    message: 'end_time must be greater or equal than start_time',
    path: ['end_time'],
  })
  .refine((data) => data.correct_count <= data.cards_reviewed, {
    message: 'correct_count must be less than or equal to cards_reviewed',
    path: ['correct_count'],
  })
  .refine((data) => data.incorrect_count <= data.cards_reviewed, {
    message: 'incorrect_count must be less than or equal to cards_reviewed',
    path: ['incorrect_count'],
  });

export const ReviewHistorySchema = z.object({
  daily_progress: z.array(DailyProgressSchema),
  sessions: z.array(ReviewSessionSchema),
});

export type DailyProgress = z.infer<typeof DailyProgressSchema>;
export type SessionCard = z.infer<typeof SessionCardSchema>;
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;
export type ReviewHistory = z.infer<typeof ReviewHistorySchema>;
