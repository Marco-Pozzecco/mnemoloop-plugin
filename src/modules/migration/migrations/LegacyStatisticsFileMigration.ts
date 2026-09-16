import type { IMigration } from '@/interfaces/migration/IMigration';
import type { IMigrationContext } from '@/interfaces/migration/IMigrationContext';
import { StatsSchema } from '@/schemas/statistics';
import { Logger } from '@/utils/Logger';
import { DATA_FILE, LEGACY_STATISTICS_FILE } from '../_utils/documents';

/**
 * v2 - imports a legacy standalone `statistics.json` into the `data.json`
 * envelope.
 *
 * The file is only imported when `data.json` already is an envelope without a
 * `statistics` key and the file parses as valid statistics. Otherwise nothing is
 * written and nothing is deleted: an unparseable or already-superseded legacy
 * file is never destroyed.
 */
export class LegacyStatisticsFileMigration implements IMigration {
	readonly toVersion = 2;
	readonly description = 'import legacy statistics.json into the data.json envelope';

	async apply(context: IMigrationContext): Promise<void> {
		const legacy = await this.readLegacyFile(context);
		if (legacy === undefined) {
			return;
		}

		const envelope = await context.read(DATA_FILE);
		if (!isRecord(envelope) || !('settings' in envelope)) {
			Logger.warn(
				`legacy ${LEGACY_STATISTICS_FILE} found but ${DATA_FILE} is not an envelope; leaving it in place`,
			);
			return;
		}
		if ('statistics' in envelope) {
			Logger.warn(
				`legacy ${LEGACY_STATISTICS_FILE} found but ${DATA_FILE} already has statistics; leaving it in place`,
			);
			return;
		}

		const statistics = StatsSchema.safeParse(legacy);
		if (!statistics.success) {
			Logger.warn(
				`legacy ${LEGACY_STATISTICS_FILE} is not valid statistics; leaving it in place`,
				statistics.error.issues,
			);
			return;
		}

		context.write(DATA_FILE, { ...envelope, statistics: statistics.data });
		context.remove(LEGACY_STATISTICS_FILE);
	}

	private async readLegacyFile(context: IMigrationContext): Promise<unknown> {
		try {
			return await context.read(LEGACY_STATISTICS_FILE);
		} catch (error) {
			Logger.warn(`legacy ${LEGACY_STATISTICS_FILE} could not be read; leaving it in place`, error);
			return undefined;
		}
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
