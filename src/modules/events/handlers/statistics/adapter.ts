import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	StatisticsAdapterInitEvent,
	StatisticsAdapterResetEvent,
	StatisticsAdapterSaveEvent,
	StatisticsAdapterSetEvent,
	StatisticsAdapterUpdateEvent,
} from '../../domains/statistics/adapter';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';

export class StatisticsAdapterInitHandler extends EventHandler<StatisticsAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)!;
		await adapter.initialize();
	}
}

export class StatisticsAdapterResetHandler extends EventHandler<StatisticsAdapterResetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterResetEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)!;
		await adapter.reset();
	}
}

export class StatisticsAdapterSaveHandler extends EventHandler<StatisticsAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterSaveEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)!;
		await adapter.save();
	}
}

export class StatisticsAdapterSetHandler extends EventHandler<StatisticsAdapterSetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: StatisticsAdapterSetEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		const { field, value } = event.data;
		adapter.setField(field, value);
	}
}

export class StatisticsAdapterUpdateHandler extends EventHandler<StatisticsAdapterUpdateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: StatisticsAdapterUpdateEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		adapter.update(event.data);
	}
}
