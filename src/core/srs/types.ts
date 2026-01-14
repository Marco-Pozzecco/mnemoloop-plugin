import { State } from 'ts-fsrs';

export { State as FSRSState };

export enum CardRating {
	AGAIN = 'Again',
	HARD = 'Hard',
	GOOD = 'Good',
	EASY = 'Easy',
}

export interface FSRSStats {
	stability: number;
	difficulty: number;
	elapsed_days: number;
	scheduled_days: number;
	learning_steps: number;
	reps: number;
	lapses: number;
	state: State;
	last_review: string | null;
	next_review: string;
}

export const DEFAULT_FSRS: FSRSStats = {
	stability: 0,
	difficulty: 0,
	elapsed_days: 0,
	scheduled_days: 0,
	learning_steps: 0,
	reps: 0,
	lapses: 0,
	state: State.New,
	last_review: null,
	next_review: new Date().toISOString(),
};

export interface FsrsCalculationInput {
	current_params: FSRSStats;
	rating: CardRating;
	review_time?: string;
}

export interface FsrsCalculationResult {
	updated_params: FSRSStats;
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
