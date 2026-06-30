import { EventRouter } from '../../core/EventRouter';
import * as events from '../../domains/settings/adapter';
import * as handlers from '../../handlers/settings/adapter';

const router = new EventRouter();

router.route(events.SettingsAdapterInitEvent, handlers.SettingsAdapterInitHandler);
router.route(events.SettingsAdapterResetEvent, handlers.SettingsAdapterResetHandler);
router.route(events.SettingsAdapterSaveEvent, handlers.SettingsAdapterSaveHandler);
router.route(events.SettingsAdapterGetRequestEvent, handlers.SettingsAdapterGetHandler);
router.route(events.SettingsAdapterSetRequestEvent, handlers.SettingsAdapterSetHandler);
router.route(events.SettingsAdapterUpdateRequestEvent, handlers.SettingsAdapterUpdateHandler);

export const SettingsAdapterRouter = router;
