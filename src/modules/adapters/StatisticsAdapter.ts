import { Stats, StatsSchema } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';

export class StatisticsAdapter extends BaseAdapter<Stats> {
	private _path: string;
	private _filename = 'statistics.json';

	constructor(private plugin: Plugin) {
		super(DEFAULT_STATISTICS, StatsSchema);
		this._path = `${plugin.manifest.dir}/${this._filename}`;
	}

	protected async loadData(): Promise<unknown> {
		const content = await this.plugin.app.vault.adapter.read(this._path);
		if (content) {
			return JSON.parse(content);
		}
		return this.defaultData;
	}

	protected async saveData(data: Stats): Promise<void> {
		const exists = await this.plugin.app.vault.adapter.exists(this._path);
		const serialized = JSON.stringify(data);
		if (exists) {
			await this.plugin.app.vault.adapter.write(this._path, serialized);
		} else {
			await this.plugin.app.vault.create(this._path, serialized);
		}
	}
}
