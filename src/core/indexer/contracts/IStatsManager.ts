import { CardMetadata } from '../schema/indexSchema';
import { Stats } from '../schema/statsSchema';

export interface IStatsManager {
	load(): Promise<void>;
	save(): Promise<void>;
	get statistics(): Stats;
	recordReview(cardId: string, rating: number): void;
	recomputeAll(index: Record<string, CardMetadata>): void;
}
