import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { PluginSettingsSchema, PluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';

export class SettingsAdapter extends BaseAdapter<PluginSettings> {
  constructor(private plugin: Plugin) {
    super(DEFAULT_PLUGIN_SETTINGS);
  }

  initialize: () => Promise<void> = async () => {
    const loaded = await this.plugin.loadData();
    this._data = Object.assign({}, this.defaultData, loaded);
  };

  save: () => Promise<void> = async () => {
    await this.plugin.saveData(this._data);
  };

  protected validate(data: PluginSettings): PluginSettings {
    return PluginSettingsSchema.parse(data);
  }
}
