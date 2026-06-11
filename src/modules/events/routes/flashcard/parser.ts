import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/flashcard/parsers';
import * as handlers from '../../handlers/flashcard/parser';

const router = new EventRouter();

router.route(events.FlashcardParserParseRequestEvent, handlers.FlashcardParserParseHandler);
router.route(
	events.FlashcardParserParseContentRequestEvent,
	handlers.FlashcardParserParseContentHandler,
);
router.route(
	events.FlashcardParserParseMetadataRequestEvent,
	handlers.FlashcardParserParseMetadataHandler,
);
router.route(events.FlashcardParserParseAllRequestEvent, handlers.FlashcardParserParseAllHandler);

export const FlashcardParserRouter = router;
