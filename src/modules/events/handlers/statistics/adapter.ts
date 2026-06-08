import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	StatisticsAdapterInitRequestEvent,
	StatisticsAdapterInitResponseEvent,
	StatisticsAdapterResetRequestEvent,
	StatisticsAdapterResetResponseEvent,
	StatisticsAdapterSaveRequestEvent,
	StatisticsAdapterSaveResponseEvent,
	StatisticsAdapterSetRequestEvent,
	StatisticsAdapterSetResponseEvent,
	StatisticsAdapterUpdateRequestEvent,
	StatisticsAdapterUpdateResponseEvent,
} from '../../domains/statistics/adapter';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';

export class StatisticsAdapterInitHandler extends EventHandler<StatisticsAdapterInitRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterInitRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		await adapter.initialize();
		this._bus.publish(new StatisticsAdapterInitResponseEvent(adapter.data));
	}
}

export class StatisticsAdapterResetHandler extends EventHandler<StatisticsAdapterResetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterResetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		await adapter.reset();
		this._bus.publish(new StatisticsAdapterResetResponseEvent(adapter.data));
	}
}

export class StatisticsAdapterSaveHandler extends EventHandler<StatisticsAdapterSaveRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterSaveRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		await adapter.save();
		this._bus.publish(new StatisticsAdapterSaveResponseEvent(adapter.data));
	}
}

export class StatisticsAdapterSetHandler extends EventHandler<StatisticsAdapterSetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: StatisticsAdapterSetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		const { field, value } = event.data;
		adapter.setField(field, value);
		this._bus.publish(new StatisticsAdapterSetResponseEvent(adapter.data));
	}
}

export class StatisticsAdapterUpdateHandler extends EventHandler<StatisticsAdapterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: StatisticsAdapterUpdateRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		adapter.update(event.data);
		this._bus.publish(new StatisticsAdapterUpdateResponseEvent(adapter.data));
	}
}
