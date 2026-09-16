import type { IMigrationContext } from './IMigrationContext';

/**
 * A single, versioned transformation of the persisted documents.
 *
 * Implementations only buffer their changes on the context; the runner decides
 * whether and when those changes are committed.
 */
export interface IMigration {
	/**
	 * Data version this migration produces. A catalog must contain one migration
	 * per version, contiguously from 1 upwards.
	 */
	readonly toVersion: number;

	/** Human-readable summary used in logs. */
	readonly description: string;

	/** Buffers this migration's document changes on `context`. */
	apply(context: IMigrationContext): Promise<void>;
}
