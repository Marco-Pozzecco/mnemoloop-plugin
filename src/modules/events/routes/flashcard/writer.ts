import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/writer';
import * as handlers from '../../handlers/flashcard/writer';

const router = new EventRouter();

router.route(events.FlashcardWriterCreateEvent, handlers.FlashcardWriterCreateHandler);
router.route(events.FlashcardWriterUpdateEvent, handlers.FlashcardWriterUpdateHandler);
router.route(events.FlashcardWriterDeleteEvent, handlers.FlashcardWriterDeleteHandler);
router.route(events.FlashcardWriterFmEvent, handlers.FlashcardWriterFmHandler);
router.route(events.FlashcardWriterBodyEvent, handlers.FlashcardWriterBodyHandler);

export const FlashcardWriterRouter = router;
