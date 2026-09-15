import { JsonData } from '@/schemas/json-data';
import { Stats, StatsSchema } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';

export class StatisticsAdapter extends BaseAdapter<Stats> {
	constructor(private plugin: Plugin) {
		super(DEFAULT_STATISTICS, StatsSchema);
	}

	protected async loadData(): Promise<unknown> {
		const data = (await this.plugin.loadData()) as JsonData;
		return data?.statistics;
	}

	protected async saveData(data: Stats): Promise<void> {
		const current = (await this.plugin.loadData()) as JsonData;
		const updated = { ...current, statistics: data };
		await this.plugin.saveData(updated);
	}
}
