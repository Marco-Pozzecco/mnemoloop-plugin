import { EventRouter } from '../../core/EventRouter';
import { FlashcardStatisticsComputeEvent } from '../../domains/flashcard/statistics';
import { DashboardOpenEvent } from '../../domains/ui/dashboard';
import {
	FlashcardStatisticsComputeHandler,
	StatisticsDashboardOpenHandler,
} from '../../handlers/statistics/compute';

const router = new EventRouter();

router.route(FlashcardStatisticsComputeEvent, FlashcardStatisticsComputeHandler);
router.route(DashboardOpenEvent, StatisticsDashboardOpenHandler);

export const StatisticsComputeRouter = router;
