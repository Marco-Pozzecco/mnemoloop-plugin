import { IEvent } from '@/interfaces/IEvent';
import { EventFactory } from '../../core/Event';

const DashboardOpenEvent = EventFactory.createEvent<void>('Dashboard:Open');
type DashboardOpenEvent = IEvent<void>;

export { DashboardOpenEvent };
