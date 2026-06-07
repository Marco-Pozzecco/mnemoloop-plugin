import { EventRouter } from '../../core/EventRouter';
import { SettingsAdapterRouter } from './adapter';

const router = new EventRouter();

router.combine(SettingsAdapterRouter);

export const SettingsRouter = router;
