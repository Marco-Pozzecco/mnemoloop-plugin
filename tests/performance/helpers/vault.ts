import {
	createRealPlugin,
	createRealVault,
	type RealStackFixture,
	type RealStackOptions,
	type RealVault,
} from '../../helpers/real-vault';
import type { PerfFixture } from './fixture';

/**
 * Performance-test view over the shared in-memory vault. The implementation
 * lives in `tests/helpers/real-vault.ts` so the playground can reuse it.
 */

export type PerfVault = RealVault;
export type { RealStackFixture, RealStackOptions };

export function createPerfVault(fixture: PerfFixture, opts: RealStackOptions = {}): PerfVault {
	return createRealVault(fixture, opts);
}

export function createPerfPlugin(vault: PerfVault, fixture: PerfFixture): any {
	return createRealPlugin(vault, fixture);
}
