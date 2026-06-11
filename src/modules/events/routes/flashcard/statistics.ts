import { EventRouter } from '../../core/EventRouter';
import { FlashcardStatisticsComputeEvent } from '../../domains/flashcard/statistics';
import { FlashcardStatisticsComputeHandler } from '../../handlers/statistics/compute';

const router = new EventRouter();

router.route(FlashcardStatisticsComputeEvent, FlashcardStatisticsComputeHandler);

export const FlashcardStatisticsRouter = router;
