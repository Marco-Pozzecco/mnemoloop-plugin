import { Plugin, TFile } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { StatsSchema, Stats } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { Logger } from '@/utils/Logger';

export class StatisticsAdapter extends BaseAdapter<Stats> {
  private _path: string;
  private _filename = 'statistics.json';

  constructor(private plugin: Plugin) {
    super(DEFAULT_STATISTICS);
    this._path = `${plugin.manifest.dir}/${this._filename}`;
  }

  initialize: () => Promise<void> = async () => {
    const file = await this.plugin.app.vault.adapter.read(this._path);
    if (file) {
      const json = JSON.parse(file);
      try {
        const index = this.validate(json);
        this.set(index);
      } catch (error) {
        Logger.warn("Statistics file is corrupted. Resetting...")
        this.save();
      }
    }
    await this.save();
  };

  save: () => Promise<void> = async () => {
    const file = await this.plugin.app.vault.adapter.exists(this._path);
    if (file) {
      await this.plugin.app.vault.adapter.write(this._path, JSON.stringify(this._data));
    } else {
      await this.plugin.app.vault.create(this._path, JSON.stringify(this._data));
    }
  };

  protected validate(data: Stats): Stats {
    return StatsSchema.parse(data);
  }
}
