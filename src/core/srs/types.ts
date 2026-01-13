export enum FSRSState {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 4,
}

export enum CardRating {
  AGAIN = 'Again',
  HARD = 'Hard',
  GOOD = 'Good',
  EASY = 'Easy',
}

export interface FSRSParameters {
  stability: number;
  difficulty: number;
  state: FSRSState;
  last_review: string | null;
  next_review: string;
  reps: number;
}

export const DEFAULT_FSRS: FSRSParameters = {
  stability: 0.0,
  difficulty: 5.0,
  state: FSRSState.NEW,
  last_review: null,
  next_review: new Date().toISOString(),
  reps: 0,
};

export interface FsrsCalculationInput {
  current_params: FSRSParameters;
  rating: CardRating;
  review_time?: string;
}

export interface FsrsCalculationResult {
  updated_params: FSRSParameters;
  interval_days: number;
}

export interface DueQueue {
  totalDue: number;
  cards: any[];
}

export interface DueQueueFilter {
  include_stale?: boolean;
  include_paused?: boolean;
  include_deleted?: boolean;
  max_cards?: number;
}

export const DEFAULT_FILTER: DueQueueFilter = {
  include_stale: false,
  include_paused: false,
  include_deleted: false,
};
