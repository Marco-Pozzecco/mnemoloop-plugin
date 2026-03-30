import { Stats } from '@/schemas';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import { EventBus } from '@/modules/event-bus/EventBus';
import { EventType } from '@/types/events';
import { AdapterStatsEvents } from '@/types/adapters';

const store = writable(DEFAULT_STATISTICS);

export class StatsStore extends BaseStoreManager<Stats> {
	constructor() {
		super(DEFAULT_STATISTICS, store);

		EventBus.instance.subscribe((event) => {
			if (event.event_type === EventType.AdapterStatisticsSave) {
				const data = event.data as AdapterStatsEvents['save']['data'];
				this.store.update((state) => {
					return {
						...state,
						...data.stats,
					};
				});
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
