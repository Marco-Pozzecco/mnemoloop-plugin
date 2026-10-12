import { describe, expect, it, vi } from 'vitest';
import { TFolder } from 'obsidian';
import { ensureVaultFolder } from '@/utils/ensureVaultFolder';
import { createRealVault } from '../../helpers/real-vault';

describe('ensureVaultFolder', () => {
	it('creates a missing single-level directory', async () => {
		const { vault, folders } = createRealVault({ files: new Map() }, { preCreateWatchDir: false });
		expect(folders.has('/flashcards')).toBe(false);

		await ensureVaultFolder(vault, '/flashcards');

		expect(folders.has('/flashcards')).toBe(true);
	});

	it('creates every missing level of a nested path', async () => {
		const { vault, folders } = createRealVault({ files: new Map() }, { preCreateWatchDir: false });

		await ensureVaultFolder(vault, '/study/flashcards');

		expect(folders.has('/study')).toBe(true);
		expect(folders.has('/study/flashcards')).toBe(true);
	});

	it('reuses an existing directory without creating it again', async () => {
		const { vault, folders } = createRealVault({ files: new Map() });
		expect(folders.has('/flashcards')).toBe(true);
		const createFolder = vi.spyOn(vault, 'createFolder');

		await ensureVaultFolder(vault, '/flashcards');

		expect(createFolder).not.toHaveBeenCalled();
	});

	it('is a no-op for the vault root', async () => {
		const { vault } = createRealVault({ files: new Map() }, { preCreateWatchDir: false });
		const createFolder = vi.spyOn(vault, 'createFolder');

		await ensureVaultFolder(vault, '/');

		expect(createFolder).not.toHaveBeenCalled();
	});

	it('is a no-op for an empty path', async () => {
		const { vault } = createRealVault({ files: new Map() }, { preCreateWatchDir: false });
		const createFolder = vi.spyOn(vault, 'createFolder');

		await ensureVaultFolder(vault, '');

		expect(createFolder).not.toHaveBeenCalled();
	});

	it('throws a descriptive error when a file occupies the path', async () => {
		const { vault } = createRealVault(
			{ files: new Map([['/flashcards', 'not a folder']]) },
			{ preCreateWatchDir: false },
		);

		await expect(ensureVaultFolder(vault, '/flashcards')).rejects.toThrow(
			/flashcards.*occupied by a file/,
		);
	});

	it('tolerates a directory created in parallel between the check and the create', async () => {
		const folder = new (TFolder as any)('/flashcards');
		let present = false;
		const vault = {
			getAbstractFileByPath: vi.fn(() => (present ? folder : null)),
			createFolder: vi.fn(async () => {
				present = true;
				throw new Error('Folder already exists: /flashcards');
			}),
		};

		await expect(ensureVaultFolder(vault as any, '/flashcards')).resolves.toBeUndefined();
		expect(vault.createFolder).toHaveBeenCalledWith('flashcards');
	});
});
