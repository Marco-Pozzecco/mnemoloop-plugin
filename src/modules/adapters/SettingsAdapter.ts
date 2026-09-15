import { DEFAULT_PLUGIN_SETTINGS, PluginSettings, PluginSettingsSchema } from '@/schemas/settings';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { JsonData } from '@/schemas/json-data';

export class SettingsAdapter extends BaseAdapter<PluginSettings> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_PLUGIN_SETTINGS, PluginSettingsSchema);
	}

	protected async loadData(): Promise<unknown> {
		const data = (await this.plugin.loadData()) as JsonData;
		return data?.settings;
	}

	protected async saveData(data: PluginSettings): Promise<void> {
		const current = ((await this.plugin.loadData()) ?? {}) as Partial<JsonData>;
		await this.plugin.saveData({ ...current, settings: data });
	}
}
