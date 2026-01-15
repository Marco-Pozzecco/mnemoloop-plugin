import { z } from 'zod';

/**
 * Validates card rating values (1-4)
 */
export const ReviewRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

/**
 * Validates review state
 */
export const ReviewStateSchema = z.object({
  currentCard: z.any().nullable(),
  isAnswerShowing: z.boolean(),
  sessionProgress: z.number().min(0).max(100),
  cardsRemaining: z.number().int().nonnegative(),
  currentIndex: z.number().int().nonnegative(),
  totalCards: z.number().int().nonnegative(),
});

export type ReviewRating = z.infer<typeof ReviewRatingSchema>;
export type ReviewState = z.infer<typeof ReviewStateSchema>;
