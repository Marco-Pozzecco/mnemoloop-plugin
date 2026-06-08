import { Stats } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { Event, EventRequest, EventResponse } from '../../core/Event';

type Adapters = 'Statistics';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	set: 'Statistics:Adapter:Set',
	update: 'Statistics:Adapter:Update',
	reset: 'Statistics:Adapter:Reset',
	save: 'Statistics:Adapter:Save',
	init: 'Statistics:Adapter:Init',
};

export class StatisticsAdapterSetRequestEvent extends EventRequest<{
	field: keyof Stats;
	value: unknown;
}> {
	constructor(data: { field: keyof Stats; value: unknown }) {
		super(t.set, data);
	}
}

export class StatisticsAdapterSetResponseEvent extends EventResponse<Stats> {
	constructor(data: Stats) {
		super(t.set, data);
	}
}

export class StatisticsAdapterUpdateRequestEvent extends EventRequest<Partial<Stats>> {
	constructor(data: Partial<Stats>) {
		super(t.update, data);
	}
}

export class StatisticsAdapterUpdateResponseEvent extends EventResponse<Stats> {
	constructor(data: Stats) {
		super(t.update, data);
	}
}

export class StatisticsAdapterResetEvent extends Event<void> {
	constructor() {
		super(t.reset, undefined);
	}
}

export class StatisticsAdapterSaveEvent extends Event<void> {
	constructor() {
		super(t.save);
	}
}

export class StatisticsAdapterInitEvent extends Event<void> {
	constructor() {
		super(t.init);
	}
}
