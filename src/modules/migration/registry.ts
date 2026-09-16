import type { IMigration } from '@/interfaces/migration/IMigration';
import { latestDataVersion } from './_core/Migrator';
import { FlatSettingsToEnvelopeMigration } from './migrations/FlatSettingsToEnvelopeMigration';
import { LegacyStatisticsFileMigration } from './migrations/LegacyStatisticsFileMigration';

/**
 * Ordered catalog of every data migration. Adding a migration means appending
 * one entry here; `LATEST_DATA_VERSION` follows automatically.
 */
export const MIGRATIONS: readonly IMigration[] = [
	new FlatSettingsToEnvelopeMigration(),
	new LegacyStatisticsFileMigration(),
];

/** Current persisted data version, derived from the catalog. */
export const LATEST_DATA_VERSION = latestDataVersion(MIGRATIONS);
