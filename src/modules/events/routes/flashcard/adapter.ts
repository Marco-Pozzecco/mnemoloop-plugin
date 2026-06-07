import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/adapter';
import * as handlers from '../../handlers/flashcard/adapter';

const router = new EventRouter();

router.route(events.FlashcardAdapterInitEvent, handlers.FlashcardAdapterInitHandler);
router.route(events.FlashcardAdapterResetEvent, handlers.FlashcardAdapterResetHandler);
router.route(events.FlashcardAdapterSaveEvent, handlers.FlashcardAdapterSaveHandler);
router.route(events.FlashcardAdapterSetEvent, handlers.FlashcardAdapterSetHandler);
router.route(events.FlashcardAdapterUpdateEvent, handlers.FlashcardAdapterUpdateHandler);

export const FlashcardAdapterRouter = router;
