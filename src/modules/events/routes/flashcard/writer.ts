import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/writer';
import * as handlers from '../../handlers/flashcard/writer';

const router = new EventRouter();

router.route(events.FlashcardWriterCreateRequestEvent, handlers.FlashcardWriterCreateHandler);
router.route(events.FlashcardWriterUpdateRequestEvent, handlers.FlashcardWriterUpdateHandler);
router.route(events.FlashcardWriterDeleteRequestEvent, handlers.FlashcardWriterDeleteHandler);
router.route(events.FlashcardWriterFmRequestEvent, handlers.FlashcardWriterFmHandler);
router.route(events.FlashcardWriterBodyRequestEvent, handlers.FlashcardWriterBodyHandler);

export const FlashcardWriterRouter = router;
