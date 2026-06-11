import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/review';
import * as handlers from '../../handlers/flashcard/review';

const router = new EventRouter();

router.route(events.FlashcardReviewSessionStartEvent, handlers.FlashcardReviewSessionStartHandler);
router.route(events.FlashcardReviewSessionScoreEvent, handlers.FlashcardReviewSessionScoreHandler);
router.route(events.FlashcardReviewSessionEndEvent, handlers.FlashcardReviewSessionEndHandler);

export const FlashcardReviewRouter = router;
