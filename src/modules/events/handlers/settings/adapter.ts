import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { AdapterKey } from '@/types/adapters';
import { EventHandler } from '../../core/EventHandler';
import {
	SettingsAdapterInitEvent,
	SettingsAdapterResetEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetEvent,
	SettingsAdapterUpdateEvent,
} from '../../domains/settings/adapter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';

export class SettingsAdapterInitHandler extends EventHandler<SettingsAdapterInitEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterInitEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)!;
		await adapter.initialize();
	}
}

export class SettingsAdapterResetHandler extends EventHandler<SettingsAdapterResetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterResetEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)!;
		await adapter.reset();
	}
}

export class SettingsAdapterSaveHandler extends EventHandler<SettingsAdapterSaveEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: SettingsAdapterSaveEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)!;
		await adapter.save();
	}
}

export class SettingsAdapterSetHandler extends EventHandler<SettingsAdapterSetEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: SettingsAdapterSetEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { field, value } = event.data;
		adapter.setField(field, value);
	}
}

export class SettingsAdapterUpdateHandler extends EventHandler<SettingsAdapterUpdateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: SettingsAdapterUpdateEvent): Promise<void> {
		const adapter = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		adapter.update(event.data);
	}
}
