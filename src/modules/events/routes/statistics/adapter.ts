import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/statistics/adapter';
import * as handlers from '../../handlers/statistics/adapter';

const router = new EventRouter();

router.route(events.StatisticsAdapterInitEvent, handlers.StatisticsAdapterInitHandler);
router.route(events.StatisticsAdapterResetEvent, handlers.StatisticsAdapterResetHandler);
router.route(events.StatisticsAdapterSaveEvent, handlers.StatisticsAdapterSaveHandler);
router.route(events.StatisticsAdapterSetEvent, handlers.StatisticsAdapterSetHandler);
router.route(events.StatisticsAdapterUpdateEvent, handlers.StatisticsAdapterUpdateHandler);

export const StatisticsAdapterRouter = router;
