export { MetadataCache } from './cache/MetadataCache';
export { IndexManager } from './managers/IndexManager';
export { StatsManager } from './managers/StatsManager';
export { StatisticsEngine } from './statistics/StatisticsEngine';
export { runMigrations } from './schema/migrations';
export type { CardMetadata, SRSObject, Index } from './schema/indexSchema';
export type { StatisticsSummary, Stats } from './schema/statsSchema';
export type { IIndexManager } from './contracts/IIndexManager';
export type { IStatsManager } from './contracts/IStatsManager';
