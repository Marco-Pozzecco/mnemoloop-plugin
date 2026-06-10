import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/indexer';
import * as handlers from '../../handlers/flashcard/indexer';

const router = new EventRouter();

router.route(events.FlashcardIndexGetAllRequestEvent, handlers.FlashcardIndexGetAllHandler);
router.route(events.FlashcardIndexGetRequestEvent, handlers.FlashcardIndexGetHandler);
router.route(events.FlashcardIndexInitEvent, handlers.FlashcardIndexInitializeHandler);
router.route(events.FlashcardIndexQueryRequestEvent, handlers.FlashcardIndexQueryHandler);
router.route(events.FlashcardIndexSaveEvent, handlers.FlashcardIndexSaveHandler);
router.route(events.FlashcardIndexUpdateRequestEvent, handlers.FlashcardIndexUpdateHandler);

export const FlashcardIndexerRouter = router;
