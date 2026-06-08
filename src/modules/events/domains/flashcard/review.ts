import { FlashcardYaml } from '@/schemas';
import { Event } from '../../core/Event';

type ReviewSessionActions = 'start' | 'end' | 'score';
type ReviewSessionEventType = `Flashcard:ReviewSession:${Capitalize<ReviewSessionActions>}`;

const t: Record<ReviewSessionActions, ReviewSessionEventType> = {
	start: 'Flashcard:ReviewSession:Start',
	end: 'Flashcard:ReviewSession:End',
	score: 'Flashcard:ReviewSession:Score',
};

type FlashcardReviewSessionStartData = {
	session_id: string;
	start_time: number;
};

export class FlashcardReviewSessionStartEvent extends Event<FlashcardReviewSessionStartData> {
	constructor(data: FlashcardReviewSessionStartData) {
		super(t.start, data);
	}
}

export type FlashcardReviewSessionEndData = {
	session_id: string;
	review_type: string;
	date: string;
	start_time: number;
	end_time: number;
	duration: number;
	count: number;
	correct_count: number;
	incorrect_count: number;
};

export class FlashcardReviewSessionEndEvent extends Event<FlashcardReviewSessionEndData> {
	constructor(data: FlashcardReviewSessionEndData) {
		super(t.end, data);
	}
}

type FlashcardReviewSessionScoreData = FlashcardYaml & {
	filepath: string;
	rating: number;
};

export class FlashcardReviewSessionScoreEvent extends Event<FlashcardReviewSessionScoreData> {
	constructor(data: FlashcardReviewSessionScoreData) {
		super(t.score, data);
	}
}
