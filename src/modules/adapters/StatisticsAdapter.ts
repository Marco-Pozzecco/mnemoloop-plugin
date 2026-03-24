import { Plugin, TFile } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { StatsSchema, Stats } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/utils/constants';

export class StatisticsAdapter extends BaseAdapter<Stats> {
  private _path: string;
  private _filename = 'statistics.json';

  constructor(private plugin: Plugin) {
    super(DEFAULT_STATISTICS);
    this._path = `${plugin.manifest.dir}/${this._filename}`;
  }

  initialize: () => Promise<void> = async () => {
    const { vault } = this.plugin.app;
    const exists = await vault.adapter.exists(this._path);

    if (!exists) {
      await this.save();
      return;
    }

    try {
      const file = vault.getAbstractFileByPath(this._path) as TFile;
      const content = await vault.read(file);
      const data = JSON.parse(content);
      this.set(data);
    } catch {
      await this.reset();
    }
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


