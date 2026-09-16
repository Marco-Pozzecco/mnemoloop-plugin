import type { IMigration } from '@/interfaces/migration/IMigration';
import type { IMigrationContext } from '@/interfaces/migration/IMigrationContext';
import { DATA_FILE } from '../_utils/documents';

/**
 * Root keys that identify a pre-envelope `data.json` payload. A payload is only
 * wrapped when it carries at least one of them.
 */
const FLAT_SETTINGS_KEYS = [
	'flashcard',
	'source_note',
	'debounce_timeout_ms',
	'enable_soft_delete',
	'soft_delete_hours',
	'banner_dismissals',
] as const;

/**
 * v1 - wraps settings stored flat at the root of `data.json` into the
 * `{ settings, statistics }` envelope, preserving an existing `statistics` key.
 *
 * Already-enveloped and unrecognized payloads are left untouched, so an unknown
 * shape is never smuggled into `settings`.
 */
export class FlatSettingsToEnvelopeMigration implements IMigration {
	readonly toVersion = 1;
	readonly description = 'wrap flat pre-envelope settings into the data.json envelope';

	async apply(context: IMigrationContext): Promise<void> {
		const payload = await context.read(DATA_FILE);
		if (!isRecord(payload)) {
			return;
		}
		if (!FLAT_SETTINGS_KEYS.some((key) => key in payload)) {
			return;
		}

		const { statistics, ...settings } = payload;
		context.write(DATA_FILE, {
			settings,
			...(statistics === undefined ? {} : { statistics }),
		});
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
