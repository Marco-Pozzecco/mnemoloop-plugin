import { DashboardRouter } from './dashboard';
import { EventRouter } from '../../core/EventRouter';

const router = new EventRouter();

router.combine(DashboardRouter);

export const UIRouter = router;
