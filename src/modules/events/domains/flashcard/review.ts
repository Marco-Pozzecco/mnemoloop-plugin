import { FlashcardYaml } from '@/schemas';
import { Event } from '../../core/Event';

type ReviewSessionActions = 'QueueInit' | 'Start' | 'End' | 'Score' | 'Recalc';
type ReviewSessionEventType = `Flashcard:ReviewSession:${Capitalize<ReviewSessionActions>}`;

type FlashcardReviewSessionInitData = null;

export class FlashcardReviewSessionQueueInitEvent extends Event<null> {
	static type: ReviewSessionEventType = 'Flashcard:ReviewSession:QueueInit';

	constructor(data: FlashcardReviewSessionInitData) {
		super(FlashcardReviewSessionQueueInitEvent.type, data);
	}
}

type FlashcardReviewSessionStartData = {
	session_id: string;
	start_time: number;
};

export class FlashcardReviewSessionStartEvent extends Event<FlashcardReviewSessionStartData> {
	static type: ReviewSessionEventType = 'Flashcard:ReviewSession:Start';

	constructor(data: FlashcardReviewSessionStartData) {
		super(FlashcardReviewSessionStartEvent.type, data);
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
	static type: ReviewSessionEventType = 'Flashcard:ReviewSession:End';
	constructor(data: FlashcardReviewSessionEndData) {
		super(FlashcardReviewSessionEndEvent.type, data);
	}
}

type FlashcardReviewSessionScoreData = FlashcardYaml & {
	filepath: string;
	rating: number;
};

export class FlashcardReviewSessionScoreEvent extends Event<FlashcardReviewSessionScoreData> {
	static type: ReviewSessionEventType = 'Flashcard:ReviewSession:Score';

	constructor(data: FlashcardReviewSessionScoreData) {
		super(FlashcardReviewSessionScoreEvent.type, data);
	}
}

export class FlashcardReviewSessionRecalcEvent extends Event<undefined> {
	static type: ReviewSessionEventType = 'Flashcard:ReviewSession:Recalc';

	constructor() {
		super(FlashcardReviewSessionRecalcEvent.type, undefined);
	}
}
