import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { AdapterKey } from '@/types/adapters';
import { IndexKey } from '@/types/indexes';
import { computeFlashcardStats } from '@/utils/statistics-utils';
import { EventBus } from '../../core/EventBus';
import { EventHandler } from '../../core/EventHandler';
import { FlashcardStatisticsComputeEvent } from '../../domains';
import { DashboardOpenEvent } from '../../domains/ui/dashboard';

export class FlashcardStatisticsComputeHandler extends EventHandler<FlashcardStatisticsComputeEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: FlashcardStatisticsComputeEvent): Promise<void> {
		const indexer = this._indexers.get(IndexKey.flashcard)! as FlashcardIndexer;
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
		stats.save();
	}
}

export class StatisticsDashboardOpenHandler extends EventHandler<DashboardOpenEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(_event: DashboardOpenEvent): Promise<void> {
		EventBus.instance.publish(new FlashcardStatisticsComputeEvent());
	}
}
