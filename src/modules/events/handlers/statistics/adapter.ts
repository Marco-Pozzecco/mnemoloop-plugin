import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	StatisticsAdapterGetRequestEvent,
	StatisticsAdapterGetResponseEvent,
	StatisticsAdapterInitEvent,
	StatisticsAdapterSaveEvent,
	StatisticsAdapterSetRequestEvent,
	StatisticsAdapterSetResponseEvent,
	StatisticsAdapterStateEvent,
	StatisticsAdapterUpdateRequestEvent,
	StatisticsAdapterUpdateResponseEvent,
} from '../../domains/statistics/adapter';

export class StatisticsAdapterInitHandler extends EventHandler<StatisticsAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		await adapter.initialize();
		void this._bus.publish(new StatisticsAdapterStateEvent(adapter.data));
	}
}

export class StatisticsAdapterResetHandler extends EventHandler<StatisticsAdapterSetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterSetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		adapter.reset();
		void this._bus.publish(new StatisticsAdapterStateEvent(adapter.data));
	}
}

export class StatisticsAdapterSaveHandler extends EventHandler<StatisticsAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterSaveEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		await adapter.save();
	}
}

export class StatisticsAdapterGetHandler extends EventHandler<StatisticsAdapterGetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: StatisticsAdapterGetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		void this._bus.publish(new StatisticsAdapterGetResponseEvent(adapter.data));
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
		void this._bus.publish(new StatisticsAdapterSetResponseEvent(adapter.data));
		void this._bus.publish(new StatisticsAdapterStateEvent(adapter.data));
	}
}

export class StatisticsAdapterUpdateHandler extends EventHandler<StatisticsAdapterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: StatisticsAdapterUpdateRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		adapter.update(event.data);
		void this._bus.publish(new StatisticsAdapterUpdateResponseEvent(adapter.data));
		void this._bus.publish(new StatisticsAdapterStateEvent(adapter.data));
	}
}
