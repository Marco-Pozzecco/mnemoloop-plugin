import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	SettingsAdapterInitRequestEvent,
	SettingsAdapterInitResponseEvent,
	SettingsAdapterResetRequestEvent,
	SettingsAdapterResetResponseEvent,
	SettingsAdapterSaveRequestEvent,
	SettingsAdapterSaveResponseEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterSetResponseEvent,
	SettingsAdapterUpdateRequestEvent,
	SettingsAdapterUpdateResponseEvent,
} from '../../domains/settings/adapter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';

export class SettingsAdapterInitHandler extends EventHandler<SettingsAdapterInitRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterInitRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.initialize();
		this._bus.publish(new SettingsAdapterInitResponseEvent(adapter.data));
	}
}

export class SettingsAdapterResetHandler extends EventHandler<SettingsAdapterResetRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterResetRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.reset();
		this._bus.publish(new SettingsAdapterResetResponseEvent(adapter.data));
	}
}

export class SettingsAdapterSaveHandler extends EventHandler<SettingsAdapterSaveRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterSaveRequestEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		await adapter.save();
		this._bus.publish(new SettingsAdapterSaveResponseEvent(adapter.data));
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
