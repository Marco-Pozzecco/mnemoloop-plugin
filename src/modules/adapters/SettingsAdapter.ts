import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { PluginSettingsSchema, PluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { AdapterEventsKeys, AdapterKey, AdapterSettingsEvents } from '@/types/adapters';
import { EventBus } from '../event-bus/EventBus';

export class SettingsAdapter extends BaseAdapter<PluginSettings, AdapterKey.settings> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_PLUGIN_SETTINGS, AdapterEventsKeys.settings, 'settings');
	}

	initialize: () => Promise<void> = async () => {
		const loaded = await this.plugin.loadData();
		this._data = Object.assign({}, this.defaultData, loaded);

		const event: AdapterSettingsEvents['init'] = {
			event_type: this._eventTypes.save,
			created_at: new Date(),
			data: { settings: this._data },
		};
		EventBus.instance.publish(event);
	};

	save: () => Promise<void> = async () => {
		await this.plugin.saveData(this._data);

		const event: AdapterSettingsEvents['save'] = {
			event_type: this._eventTypes.save,
			created_at: new Date(),
			data: { settings: this._data, saved_at: new Date() },
		};
		EventBus.instance.publish(event);
	};

	protected validate(data: PluginSettings): PluginSettings {
		return PluginSettingsSchema.parse(data);
	}
}
