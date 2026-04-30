import { IEvent } from '@/interfaces/IEvent';
import { Stats, StatsSchema } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { Plugin } from 'obsidian';
import {
	AdapterAction,
	EventBus,
	StatisticsAdapterInitResponseEvent,
	StatisticsAdapterResetResponseEvent,
	StatisticsAdapterSaveResponseEvent,
	StatisticsAdapterSetResponseEvent,
	StatisticsAdapterUpdatedResponseEvent,
} from '../events';
import { BaseAdapter } from './BaseAdapter';

export class StatisticsAdapter extends BaseAdapter<Stats> {
	private _path: string;
	private _filename = 'statistics.json';

	constructor(private plugin: Plugin) {
		super(DEFAULT_STATISTICS, StatsSchema);
		this._path = `${plugin.manifest.dir}/${this._filename}`;
	}

	emit: (action: AdapterAction) => void = (action) => {
		let event: IEvent | null = null;

		switch (action) {
			case AdapterAction.Init:
				event = new StatisticsAdapterInitResponseEvent(this._data);
				break;
			case AdapterAction.Save:
				event = new StatisticsAdapterSaveResponseEvent(this._data);
				break;
			case AdapterAction.Reset:
				event = new StatisticsAdapterResetResponseEvent(this._data);
				break;
			case AdapterAction.Update:
				event = new StatisticsAdapterUpdatedResponseEvent(this._data);
				break;
			case AdapterAction.Set:
				event = new StatisticsAdapterSetResponseEvent(this._data);
				break;
		}

		if (event) {
			EventBus.instance.publish(event);
		}
	};

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
