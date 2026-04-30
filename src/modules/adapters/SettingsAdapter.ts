import { DEFAULT_PLUGIN_SETTINGS, PluginSettings, PluginSettingsSchema } from '@/schemas/settings';
import { Plugin } from 'obsidian';
import {
	AdapterAction,
	EventBus,
	SettingsAdapterInitResponseEvent,
	SettingsAdapterResetResponseEvent,
	SettingsAdapterSaveResponseEvent,
	SettingsAdapterSetResponseEvent,
	SettingsAdapterUpdatedResponseEvent,
} from '../events';
import { BaseAdapter } from './BaseAdapter';
import { IEvent } from '@/interfaces/IEvent';

export class SettingsAdapter extends BaseAdapter<PluginSettings> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_PLUGIN_SETTINGS, PluginSettingsSchema);
	}

	emit: (action: AdapterAction) => void = (action) => {
		let event: IEvent | null = null;

		switch (action) {
			case AdapterAction.Init:
				event = new SettingsAdapterInitResponseEvent(this._data);
				break;
			case AdapterAction.Save:
				event = new SettingsAdapterSaveResponseEvent(this._data);
				break;
			case AdapterAction.Reset:
				event = new SettingsAdapterResetResponseEvent(this._data);
				break;
			case AdapterAction.Update:
				event = new SettingsAdapterUpdatedResponseEvent(this._data);
				break;
			case AdapterAction.Set:
				event = new SettingsAdapterSetResponseEvent(this._data);
				break;
		}

		if (event) {
			EventBus.instance.publish(event);
		}
	};

	protected async loadData(): Promise<unknown> {
		return await this.plugin.loadData();
	}

	protected async saveData(data: PluginSettings): Promise<void> {
		await this.plugin.saveData(data);
	}
}
