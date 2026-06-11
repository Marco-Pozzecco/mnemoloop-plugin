import { EventRouter } from '../../core/EventRouter';
import { StatisticsAdapterRouter } from './adapter';
import { StatisticsComputeRouter } from './compute';

const router = new EventRouter();

router.combine(StatisticsAdapterRouter, StatisticsComputeRouter);

export const StatisticsRouter = router;
