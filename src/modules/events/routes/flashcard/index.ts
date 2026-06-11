import { EventRouter } from '../../core/EventRouter';
import { FlashcardAdapterRouter } from './adapter';
import { FlashcardIndexerRouter } from './indexer';
import { FlashcardParserRouter } from './parser';
import { FlashcardReviewRouter } from './review';
import { FlashcardStatisticsRouter } from './statistics';
import { FlashcardWriterRouter } from './writer';

const router = new EventRouter();

router.combine(
	FlashcardAdapterRouter,
	FlashcardIndexerRouter,
	FlashcardParserRouter,
	FlashcardReviewRouter,
	FlashcardStatisticsRouter,
	FlashcardWriterRouter,
);

export const FlashcardRouter = router;
