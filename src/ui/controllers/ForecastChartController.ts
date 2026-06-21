import {
	EventBus,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
} from '@/modules/events';
import { type FlashcardMetadata } from '@/schemas';
import { computeForecastData } from '@/ui/components/elements/Chart/Forecast/utils';
import {
	chartForecastStore,
	ChartForecastStore,
	ForecastChartTimeframe,
} from '../store/chart.forecast.store';

export class ForecastChartController {
	private _flashcards: FlashcardMetadata[] = [];
	private _unsubscribeFlashcards: () => void;
	private _store: ChartForecastStore = chartForecastStore;

	constructor() {
		this._unsubscribeFlashcards = EventBus.instance.subscribe(
			FlashcardIndexStateEvent,
			async (event) => {
				this._flashcards = event.data.flashcards;
				this._recompute();
			},
		);
	}

	get store() {
		return this._store.store;
	}

	private _recompute(): void {
		const days = this._getDaysInTimeframe(this._store.state.timeframe);
		const data = computeForecastData(this._flashcards, days);
		this._store.setData(data);
	}

	private _getDaysInTimeframe(timeframe: ForecastChartTimeframe): number {
		switch (timeframe) {
			case 'month':
				return 30;
			case 'quarter':
				return 90;
			case 'year':
				return 365;
			default:
				return 30;
		}
	}

	async init(): Promise<void> {
		EventBus.instance.subscribeOnce(FlashcardIndexGetAllResponseEvent, async (event) => {
			this._flashcards = event.data;
			this._recompute();
		});

		await EventBus.instance.publish(new FlashcardIndexGetAllRequestEvent());
	}

	setTimeframe(timeframe: 'month' | 'quarter' | 'year') {
		this._store.setTimeframe(timeframe);
		this._recompute();
	}

	dispose(): void {
		this._unsubscribeFlashcards();
	}
}
