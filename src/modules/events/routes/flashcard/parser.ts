import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/parsers';
import * as handlers from '../../handlers/flashcard/parser';

const router = new EventRouter();

router.route(events.FlashcardParserParseEvent, handlers.FlashcardParserParseHandler);
router.route(events.FlashcardParserParseContentEvent, handlers.FlashcardParserParseContentHandler);
router.route(events.FlashcardParserParseMetadataEvent, handlers.FlashcardParserParseMetadataHandler);
router.route(events.FlashcardParserParseAllEvent, handlers.FlashcardParserParseAllHandler);

export const FlashcardParserRouter = router;
