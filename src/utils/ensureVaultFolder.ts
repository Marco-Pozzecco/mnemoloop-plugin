import { normalizePath, TFolder, Vault } from 'obsidian';

/**
 * Ensures a vault-relative directory exists, creating every missing ancestor
 * level (Obsidian's `Vault.createFolder` only creates a single level).
 *
 * The vault root and an empty path are no-ops because the root always exists.
 * Throws a descriptive error when a non-folder item occupies the path, and
 * tolerates a directory that appears between the existence check and the create
 * so concurrent creations do not fail on a duplicate-create race.
 */
export async function ensureVaultFolder(vault: Vault, directory: string): Promise<void> {
	const normalized = normalizePath(directory);
	if (normalized === '/' || normalized === '') return;

	let current = '';
	for (const segment of normalized.split('/')) {
		current = current === '' ? segment : `${current}/${segment}`;

		const existing = vault.getAbstractFileByPath(current);
		if (existing) {
			if (!(existing instanceof TFolder)) {
				throw new Error(
					`Cannot create flashcard directory: "${current}" is occupied by a file`,
				);
			}
			continue;
		}

		try {
			await vault.createFolder(current);
		} catch (error) {
			// A parallel create may have made the folder between the check and the
			// create; treat a folder that now exists as success.
			if (vault.getAbstractFileByPath(current) instanceof TFolder) continue;
			throw error;
		}
	}
}
