import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/indexer';
import * as handlers from '../../handlers/flashcard/indexer';

const router = new EventRouter();

router.route(events.FlashcardIndexGetAllEvent, handlers.FlashcardIndexGetAllHandler);
router.route(events.FlashcardIndexGetEvent, handlers.FlashcardIndexGetHandler);
router.route(events.FlashcardIndexInitializeEvent, handlers.FlashcardIndexInitializeHandler);
router.route(events.FlashcardIndexQueryEvent, handlers.FlashcardIndexQueryHandler);
router.route(events.FlashcardIndexRecalcEvent, handlers.FlashcardIndexRecalcHandler);
router.route(events.FlashcardIndexSaveEvent, handlers.FlashcardIndexSaveHandler);
router.route(events.FlashcardIndexUpdateEvent, handlers.FlashcardIndexUpdateHandler);

export const FlashcardIndexerRouter = router;
