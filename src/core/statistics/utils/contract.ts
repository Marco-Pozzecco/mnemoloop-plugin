import { FlashcardMetadata } from '../../indexer/schema/IndexerSchema';
import { Stats } from '../schema/StatisticsSchema';
import { ReviewSession } from '../schema/StatisticsSchema';

export interface IStatsManager {
	load(): Promise<void>;
	save(): Promise<void>;
	get statistics(): Stats;
	recordSession(session: ReviewSession): Promise<void>;
	recomputeAll(index: Record<string, FlashcardMetadata>): void;
}
