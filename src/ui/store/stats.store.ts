import { Stats } from '@/schemas';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import { EventBus, StatisticsAdapterSaveResponseEvent } from '@/modules/events';

const store = writable(DEFAULT_STATISTICS);

export class StatsStore extends BaseStoreManager<Stats> {
	constructor() {
		super(DEFAULT_STATISTICS, store);

		EventBus.instance.subscribe((event) => {
			if (event.isType(StatisticsAdapterSaveResponseEvent.type)) {
				const data = event.data as StatisticsAdapterSaveResponseEvent['data'];
				this.store.update(() => data);
			}
		});
	}

	get stats() {
		return this.state;
	}

	set stats(stats: Stats) {
		this.store.update((state) => ({ ...state, ...stats }));
	}
}

export const statsStore = new StatsStore();
