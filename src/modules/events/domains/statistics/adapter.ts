import { Stats } from '@/schemas';
import { Event } from '../../core/Event';

export enum AdapterAction {
	Set = 'set',
	Update = 'update',
	Reset = 'reset',
	Save = 'save',
	Init = 'init',
}

type Adapters = 'Statistics';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

export class StatisticsAdapterSetEvent extends Event<{
	field: keyof Stats;
	value: unknown;
}> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Set';

	constructor(data: { field: keyof Stats; value: unknown }) {
		super(StatisticsAdapterSetEvent.type, data);
	}
}

export class StatisticsAdapterUpdateEvent extends Event<Partial<Stats>> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Update';

	constructor(data: Partial<Stats>) {
		super(StatisticsAdapterUpdateEvent.type, data);
	}
}

export class StatisticsAdapterResetEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Reset';

	constructor() {
		super(StatisticsAdapterResetEvent.type, undefined);
	}
}

export class StatisticsAdapterSaveEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Save';

	constructor() {
		super(StatisticsAdapterSaveEvent.type, undefined);
	}
}

export class StatisticsAdapterInitEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Init';

	constructor() {
		super(StatisticsAdapterInitEvent.type, undefined);
	}
}
