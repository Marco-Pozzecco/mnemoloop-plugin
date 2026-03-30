import { Stats, StatsSchema } from '@/schemas/statistics';
import { AdapterEventsKeys, AdapterKey, AdapterStatsEvents } from '@/types/adapters';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { Logger } from '@/utils/Logger';
import { Plugin } from 'obsidian';
import { EventBus } from '../event-bus/EventBus';
import { BaseAdapter } from './BaseAdapter';

export class StatisticsAdapter extends BaseAdapter<Stats, AdapterKey.statistics> {
	private _path: string;
	private _filename = 'statistics.json';

	constructor(private plugin: Plugin) {
		super(DEFAULT_STATISTICS, AdapterEventsKeys.statistics, 'stats');
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
				Logger.warn('Statistics file is corrupted. Resetting...');
				this.save();
			}
		}

		const event: AdapterStatsEvents['init'] = {
			event_type: this._eventTypes.init,
			created_at: new Date(),
			data: {
				stats: this._data,
			},
		};
		EventBus.instance.publish(event);
	};

	save: () => Promise<void> = async () => {
		const file = await this.plugin.app.vault.adapter.exists(this._path);
		if (file) {
			await this.plugin.app.vault.adapter.write(this._path, JSON.stringify(this._data));
		} else {
			await this.plugin.app.vault.create(this._path, JSON.stringify(this._data));
		}

		const event: AdapterStatsEvents['save'] = {
			event_type: this._eventTypes.save,
			created_at: new Date(),
			data: {
				stats: this._data,
				saved_at: new Date(),
			},
		};
		EventBus.instance.publish(event);
	};

	protected validate(data: Stats): Stats {
		return StatsSchema.parse(data);
	}
}
