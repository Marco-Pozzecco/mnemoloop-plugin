import { IEvent } from '@/interfaces/IEvent';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { AdapterKey } from '@/types/adapters';
import { ProcessorKey } from '@/types/processors';
import { EventProcessor } from '../core/EventProcessor';
import { EventRegistry } from '../core/EventRegistry';
import {
	SettingsAdapterResetRequestEvent,
	SettingsAdapterSaveRequestEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterUpdateRequestEvent,
} from '../domains';

export class SettingsProcessor extends EventProcessor {
	protected readonly eventTypes: string[] = [
		SettingsAdapterSetRequestEvent.type,
		SettingsAdapterUpdateRequestEvent.type,
		SettingsAdapterResetRequestEvent.type,
		SettingsAdapterSaveRequestEvent.type,
	];

	private readonly _settingsAdapter: SettingsAdapter;

	static {
		EventRegistry.instance.register(ProcessorKey.settings, (deps: IEventRegistryDependencies) => {
			const settingsAdapter = deps.adapters.get(AdapterKey.settings);
			if (!settingsAdapter) {
				throw new Error('Settings adapter not found');
			}
			return new SettingsProcessor(settingsAdapter as SettingsAdapter);
		});
	}

	constructor(settingsAdapter: SettingsAdapter) {
		super();
		this._settingsAdapter = settingsAdapter;
	}

	protected process(event: IEvent): void {
		if (event.type === SettingsAdapterSetRequestEvent.type) {
			const { field, value } = (event as SettingsAdapterSetRequestEvent).data;
			this._settingsAdapter.setField(field, value);
			return;
		}

		if (event.type === SettingsAdapterUpdateRequestEvent.type) {
			const data = (event as SettingsAdapterUpdateRequestEvent).data;
			this._settingsAdapter.update(data);
			return;
		}

		if (event.type === SettingsAdapterResetRequestEvent.type) {
			this._settingsAdapter.reset();
			return;
		}

		if (event.type === SettingsAdapterSaveRequestEvent.type) {
			this._settingsAdapter.save();
			return;
		}
	}
}
