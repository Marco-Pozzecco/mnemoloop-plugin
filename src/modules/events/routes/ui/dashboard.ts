import { EventRouter } from '../../core/EventRouter';
import { DashboardOpenEvent } from '../../domains/ui/dashboard';
import { StatisticsDashboardOpenHandler } from '../../handlers/statistics/compute';

const router = new EventRouter();

router.route(DashboardOpenEvent, StatisticsDashboardOpenHandler);

export const DashboardRouter = router;
