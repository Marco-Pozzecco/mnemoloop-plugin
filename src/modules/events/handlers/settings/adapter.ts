import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	SettingsAdapterInitEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterSetResponseEvent,
	SettingsAdapterUpdateRequestEvent,
	SettingsAdapterUpdateResponseEvent,
} from '../../domains/settings/adapter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';

export class SettingsAdapterInitHandler extends EventHandler<SettingsAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.initialize();
	}
}

export class SettingsAdapterResetHandler extends EventHandler<SettingsAdapterSetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterSetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.reset();
	}
}

export class SettingsAdapterSaveHandler extends EventHandler<SettingsAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterSaveEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.save();
	}
}

export class SettingsAdapterSetHandler extends EventHandler<SettingsAdapterSetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: SettingsAdapterSetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { field, value } = event.data;
		adapter.setField(field, value);
		this._bus.publish(new SettingsAdapterSetResponseEvent(adapter.data));
	}
}

export class SettingsAdapterUpdateHandler extends EventHandler<SettingsAdapterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: SettingsAdapterUpdateRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		adapter.update(event.data);
		this._bus.publish(new SettingsAdapterUpdateResponseEvent(adapter.data));
	}
}
