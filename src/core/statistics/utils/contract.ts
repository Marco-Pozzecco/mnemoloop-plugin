import { CardMetadata } from '../../indexer/schema/IndexerSchema';
import { Stats } from '../schema/StatisticsSchema';

export interface IStatsManager {
	load(): Promise<void>;
	save(): Promise<void>;
	get statistics(): Stats;
	recordReview(cardId: string, rating: number): void;
	recomputeAll(index: Record<string, CardMetadata>): void;
}
