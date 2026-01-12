import { StatisticsSummary } from '../schema/statsSchema';
import { CardMetadata } from '../schema/indexSchema';

export interface IStatsManager {
  load(): Promise<void>;
  save(): Promise<void>;
  recordReview(cardId: string, rating: number, success: boolean): void;
  getSummary(): StatisticsSummary;
  recomputeAll(index: Record<string, CardMetadata>): void;
}