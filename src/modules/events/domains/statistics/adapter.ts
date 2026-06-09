import { IEvent } from '@/interfaces/IEvent';
import { Stats } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { EventFactory } from '../../core/Event';

type Adapters = 'Statistics';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	set: 'Statistics:Adapter:Set',
	update: 'Statistics:Adapter:Update',
	reset: 'Statistics:Adapter:Reset',
	save: 'Statistics:Adapter:Save',
	init: 'Statistics:Adapter:Init',
	state: 'Statistics:Adapter:State',
};

const StatisticsAdapterSetRequestEvent = EventFactory.createRequest<{
	field: keyof Stats;
	value: unknown;
}>(t.set);
type StatisticsAdapterSetRequestEvent = IEvent<{ field: keyof Stats; value: unknown }>;

const StatisticsAdapterSetResponseEvent = EventFactory.createResponse<Stats>(t.set);
type StatisticsAdapterSetResponseEvent = IEvent<Stats>;

const StatisticsAdapterUpdateRequestEvent = EventFactory.createRequest<Partial<Stats>>(t.update);
type StatisticsAdapterUpdateRequestEvent = IEvent<Partial<Stats>>;

const StatisticsAdapterUpdateResponseEvent = EventFactory.createResponse<Stats>(t.update);
type StatisticsAdapterUpdateResponseEvent = IEvent<Stats>;

const StatisticsAdapterResetEvent = EventFactory.createEvent<void>(t.reset);
type StatisticsAdapterResetEvent = IEvent<void>;

const StatisticsAdapterSaveEvent = EventFactory.createEvent<void>(t.save);
type StatisticsAdapterSaveEvent = IEvent<void>;

const StatisticsAdapterInitEvent = EventFactory.createEvent<void>(t.init);
type StatisticsAdapterInitEvent = IEvent<void>;

const StatisticsAdapterStateEvent = EventFactory.createEvent<Stats>(t.state);
type StatisticsAdapterStateEvent = IEvent<Stats>;

export {
	StatisticsAdapterInitEvent,
	StatisticsAdapterResetEvent,
	StatisticsAdapterSaveEvent,
	StatisticsAdapterSetRequestEvent,
	StatisticsAdapterSetResponseEvent,
	StatisticsAdapterStateEvent,
	StatisticsAdapterUpdateRequestEvent,
	StatisticsAdapterUpdateResponseEvent,
};
