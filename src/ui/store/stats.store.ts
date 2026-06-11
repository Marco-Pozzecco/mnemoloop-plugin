import { EventBus, StatisticsAdapterStateEvent } from '@/modules/events';
import { Stats } from '@/schemas';
import { DEFAULT_STATISTICS } from '@/utils/constants';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

const store = writable(DEFAULT_STATISTICS);

export class StatsStore extends BaseStoreManager<Stats> {
	private _unsubscribe: () => void = () => {};

	constructor() {
		super(DEFAULT_STATISTICS, store);

		const handler = (event: StatisticsAdapterStateEvent) => {
			this.store.update(() => event.data);
		};
		this._unsubscribe = EventBus.instance.subscribe(StatisticsAdapterStateEvent, handler);
	}

	get stats() {
		return this.state;
	}

	set stats(stats: Stats) {
		this.store.update((state) => ({ ...state, ...stats }));
	}

	dispose(): void {
		this._unsubscribe();
	}
}

export const statsStore = new StatsStore();
