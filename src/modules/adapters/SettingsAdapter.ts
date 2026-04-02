import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { PluginSettingsSchema, PluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { AdapterEventsKeys, AdapterKey } from '@/types/adapters';

export class SettingsAdapter extends BaseAdapter<PluginSettings, AdapterKey.settings> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_PLUGIN_SETTINGS, AdapterEventsKeys.settings, 'settings', PluginSettingsSchema);
	}

	protected async loadData(): Promise<unknown> {
		return await this.plugin.loadData();
	}

	protected async saveData(data: PluginSettings): Promise<void> {
		await this.plugin.saveData(data);
	}
}
