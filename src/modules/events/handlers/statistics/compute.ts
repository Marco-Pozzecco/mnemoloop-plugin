import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardMetadata } from '@/schemas';
import { AdapterKey } from '@/types/adapters';
import { IndexKey } from '@/types/indexes';
import {
	BUFFER_MS,
	computeFlashcardStats,
	computeNextRecalcDelay,
	MAX_RECALC_DELAY_MS,
} from '@/utils/statistics-utils';
import { EventBus } from '../../core/EventBus';
import { EventHandler } from '../../core/EventHandler';
import { FlashcardStatisticsComputeEvent, StatisticsAdapterStateEvent } from '../../domains';
import { DashboardOpenEvent } from '../../domains/ui/dashboard';

export class FlashcardStatisticsComputeHandler extends EventHandler<FlashcardStatisticsComputeEvent> {
	private _nextCompute: number | null = null;

	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardStatisticsComputeEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)!;
		const stats = this._adapters.get(AdapterKey.statistics)! as StatisticsAdapter;
		const flashcards = indexer.getAll();
		const now = new Date();
		const computed = computeFlashcardStats(flashcards, now);

		stats.update({
			flashcard: {
				...stats.data.flashcard,
				...computed,
				next_review: computed.next_review?.toISOString() ?? new Date().toISOString(),
			},
			updated_at: new Date().toISOString(),
		});
		void stats.save();

		this._handleNextCompute(flashcards);
		void this._bus.publish(new StatisticsAdapterStateEvent(stats.data));
	}

	private _handleNextCompute(flashcards: FlashcardMetadata[]): void {
		this._clearNextCompute();

		const now = new Date();
		const delay = computeNextRecalcDelay(flashcards, now, BUFFER_MS, MAX_RECALC_DELAY_MS);

		if (delay === null) return;

		this._nextCompute = window.setTimeout(() => {
			void EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
		}, delay);
	}

	private _clearNextCompute(): void {
		if (this._nextCompute !== null) {
			window.clearTimeout(this._nextCompute);
			this._nextCompute = null;
		}
	}
}

export class StatisticsDashboardOpenHandler extends EventHandler<DashboardOpenEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: DashboardOpenEvent): Promise<void> {
		void EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}
