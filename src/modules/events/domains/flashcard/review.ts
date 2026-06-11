import { IEvent } from '@/interfaces/IEvent';
import { FlashcardYaml } from '@/schemas';
import { EventFactory } from '../../core/Event';

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

const FlashcardReviewSessionStartEvent = EventFactory.createEvent<FlashcardReviewSessionStartData>(t.start);
type FlashcardReviewSessionStartEvent = IEvent<FlashcardReviewSessionStartData>;

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

const FlashcardReviewSessionEndEvent = EventFactory.createEvent<FlashcardReviewSessionEndData>(t.end);
type FlashcardReviewSessionEndEvent = IEvent<FlashcardReviewSessionEndData>;

type FlashcardReviewSessionScoreData = FlashcardYaml & {
	filepath: string;
	rating: number;
};

const FlashcardReviewSessionScoreEvent = EventFactory.createEvent<FlashcardReviewSessionScoreData>(t.score);
type FlashcardReviewSessionScoreEvent = IEvent<FlashcardReviewSessionScoreData>;

export {
	FlashcardReviewSessionEndEvent,
	FlashcardReviewSessionScoreEvent,
	FlashcardReviewSessionStartEvent,
};
