import type { IDocumentStore } from '@/interfaces/migration/IDocumentStore';
import type { IMigration } from '@/interfaces/migration/IMigration';
import { Logger } from '@/utils/Logger';
import { DATA_FILE } from '../_utils/documents';
import { MigrationContext } from './MigrationContext';

/**
 * Highest version produced by a migration catalog. The current data version is
 * always derived from the catalog so it can never drift from the migrations.
 */
export function latestDataVersion(migrations: readonly IMigration[]): number {
	return migrations.reduce((latest, migration) => Math.max(latest, migration.toVersion), 0);
}

/**
 * Reads the stored data version. An absent document, a non-object payload, or
 * an invalid version reads as 0, which migrates from the beginning.
 */
export function readDataVersion(data: unknown): number {
	if (typeof data !== 'object' || data === null || Array.isArray(data)) {
		return 0;
	}

	const version = (data as Record<string, unknown>).version;
	return typeof version === 'number' && Number.isInteger(version) && version >= 0 ? version : 0;
}

/**
 * Applies every pending data migration to the persisted documents.
 *
 * The runner is the only caller of `MigrationContext.commit()`: it validates the
 * catalog, runs the migrations whose `toVersion` is above the stored version in
 * ascending order, stamps the current version, and commits. Any failure is
 * logged and commits nothing, so the stored documents stay untouched and the
 * next load retries. `run()` never throws.
 */
export class Migrator {
	constructor(
		private readonly _store: IDocumentStore,
		private readonly _migrations: readonly IMigration[],
	) {}

	async run(): Promise<void> {
		try {
			this.validateCatalog();

			const context = new MigrationContext(this._store);
			const current = readDataVersion(await context.read(DATA_FILE));
			const latest = latestDataVersion(this._migrations);
			if (current >= latest) {
				return;
			}

			const pending = [...this._migrations]
				.filter((migration) => migration.toVersion > current)
				.sort((a, b) => a.toVersion - b.toVersion);
			for (const migration of pending) {
				Logger.info(`applying data migration ${migration.toVersion}: ${migration.description}`);
				await migration.apply(context);
			}

			const migrated = await context.read(DATA_FILE);
			context.write(DATA_FILE, {
				...(isRecord(migrated) ? migrated : {}),
				version: latest,
			});
			await context.commit();
		} catch (error) {
			Logger.error('data migrations failed; stored data left untouched', error);
		}
	}

	/**
	 * Rejects a catalog that is not exactly versions 1..N, so a duplicate or a
	 * skipped version can never be committed silently.
	 */
	private validateCatalog(): void {
		const versions = this._migrations.map((migration) => migration.toVersion).sort((a, b) => a - b);
		const isContiguous = versions.every((version, index) => version === index + 1);
		if (!isContiguous) {
			throw new Error(
				`data migration catalog must contain contiguous versions starting at 1, got [${versions.join(', ')}]`,
			);
		}
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
