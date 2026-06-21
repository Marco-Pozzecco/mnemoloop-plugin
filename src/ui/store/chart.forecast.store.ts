import { writable } from 'svelte/store';
import { ForecastDatum } from '../components/elements/Chart/Forecast/types';
import { BaseStoreManager } from './base.store';

export type ForecastChartTimeframe = 'month' | 'quarter' | 'year';

type ChartForecastState = {
	data: ForecastDatum[];
	timeframe: ForecastChartTimeframe;
};

const initialState: ChartForecastState = {
	data: [],
	timeframe: 'month',
};

const store = writable<ChartForecastState>(initialState);

export class ChartForecastStore extends BaseStoreManager<ChartForecastState> {
	constructor() {
		super(initialState, store);
	}

	setTimeframe(timeframe: ForecastChartTimeframe) {
		this.store.update((state) => ({ ...state, timeframe }));
	}

	setData(data: ForecastDatum[]) {
		this.store.update((state) => ({ ...state, data }));
	}
}

export const chartForecastStore = new ChartForecastStore();
