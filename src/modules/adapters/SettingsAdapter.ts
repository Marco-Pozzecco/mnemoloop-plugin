import { DEFAULT_PLUGIN_SETTINGS, PluginSettings, PluginSettingsSchema } from '@/schemas/settings';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';

export class SettingsAdapter extends BaseAdapter<PluginSettings> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_PLUGIN_SETTINGS, PluginSettingsSchema);
	}

	protected async loadData(): Promise<unknown> {
		return await this.plugin.loadData();
	}

	protected async saveData(data: PluginSettings): Promise<void> {
		await this.plugin.saveData(data);
	}
}
