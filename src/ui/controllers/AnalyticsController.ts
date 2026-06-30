import {
	EventBus,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
	StatisticsAdapterGetRequestEvent,
	StatisticsAdapterGetResponseEvent,
	StatisticsAdapterStateEvent,
} from '@/modules/events';
import { type FlashcardMetadata } from '@/schemas';
import { analyticsStore } from '../store/analytics.store';

export class AnalyticsController {
	private _flashcards: FlashcardMetadata[] = [];
	private _unsubscribeFlashcards: () => void;
	private _unsubscribeStats: () => void;

	constructor() {
		this._unsubscribeFlashcards = EventBus.instance.subscribe(
			FlashcardIndexStateEvent,
			async (event) => {
				this._flashcards = event.data.flashcards;
				this._recompute();
			},
		);

		this._unsubscribeStats = EventBus.instance.subscribe(
			StatisticsAdapterStateEvent,
			async (event) => {
				analyticsStore.setStats(event.data);
			},
		);
	}

	async init(): Promise<void> {
		EventBus.instance.subscribeOnce(FlashcardIndexGetAllResponseEvent, async (event) => {
			this._flashcards = event.data;
			this._recompute();
		});

		EventBus.instance.subscribeOnce(StatisticsAdapterGetResponseEvent, async (event) => {
			analyticsStore.setStats(event.data);
		});

		await EventBus.instance.publish(new FlashcardIndexGetAllRequestEvent());
		await EventBus.instance.publish(new StatisticsAdapterGetRequestEvent());
	}

	dispose(): void {
		this._unsubscribeFlashcards();
		this._unsubscribeStats();
	}

	private _recompute(): void {
		analyticsStore.setFlashcards(this._flashcards);
	}
}
