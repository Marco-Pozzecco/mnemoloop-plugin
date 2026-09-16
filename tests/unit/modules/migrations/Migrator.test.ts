import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMigration } from '@/interfaces/migration/IMigration';
import type { IMigrationContext } from '@/interfaces/migration/IMigrationContext';
import { Migrator, readDataVersion } from '@/modules/migration/_core/Migrator';
import { DATA_FILE } from '@/modules/migration/_utils/documents';
import { Logger } from '@/utils/Logger';
import { MemoryDocumentStore } from '../../../helpers/memory-document-store';

function createMigration(
	toVersion: number,
	apply: (context: IMigrationContext) => Promise<void> = async () => {},
): IMigration {
	return { toVersion, description: `migration ${toVersion}`, apply };
}

describe('Migrator', () => {
	let store: MemoryDocumentStore;

	beforeEach(() => {
		store = new MemoryDocumentStore();
	});

	describe('run', () => {
		it('should apply every migration and stamp the current version on a fresh store', async () => {
			const applied: number[] = [];
			const migrator = new Migrator(store, [
				createMigration(1, async () => {
					applied.push(1);
				}),
				createMigration(2, async () => {
					applied.push(2);
				}),
			]);

			await migrator.run();

			expect(applied).toEqual([1, 2]);
			expect(store.get(DATA_FILE)).toEqual({ version: 2 });
		});

		it('should apply only the migrations above the stored version', async () => {
			store = new MemoryDocumentStore({ [DATA_FILE]: { version: 1 } });
			const applied: number[] = [];
			const migrator = new Migrator(store, [
				createMigration(1, async () => {
					applied.push(1);
				}),
				createMigration(2, async () => {
					applied.push(2);
				}),
			]);

			await migrator.run();

			expect(applied).toEqual([2]);
			expect(store.get(DATA_FILE)).toEqual({ version: 2 });
		});

		it('should apply migrations in ascending version order irrespective of catalog order', async () => {
			const applied: number[] = [];
			const migrator = new Migrator(store, [
				createMigration(2, async () => {
					applied.push(2);
				}),
				createMigration(1, async () => {
					applied.push(1);
				}),
			]);

			await migrator.run();

			expect(applied).toEqual([1, 2]);
			expect(store.get(DATA_FILE)).toEqual({ version: 2 });
		});

		it('should let later migrations observe writes buffered by earlier ones', async () => {
			let observed: unknown;
			const migrator = new Migrator(store, [
				createMigration(1, async (context) => {
					context.write(DATA_FILE, { settings: { marker: '#' } });
				}),
				createMigration(2, async (context) => {
					observed = await context.read(DATA_FILE);
				}),
			]);

			await migrator.run();

			expect(observed).toEqual({ settings: { marker: '#' } });
			expect(store.get(DATA_FILE)).toEqual({ settings: { marker: '#' }, version: 2 });
		});

		it('should preserve existing payload keys when stamping the version', async () => {
			store = new MemoryDocumentStore({ [DATA_FILE]: { version: 0, custom: 'keep' } });
			const migrator = new Migrator(store, [createMigration(1)]);

			await migrator.run();

			expect(store.get(DATA_FILE)).toEqual({ custom: 'keep', version: 1 });
		});

		it.each([
			['a non-integer version', { version: 1.5 }],
			['a negative version', { version: -1 }],
			['a string version', { version: '2' }],
			['a null version', { version: null }],
			['a non-object payload', 'not-an-object'],
		])('should treat %s as version 0', async (_label, stored) => {
			store = new MemoryDocumentStore({ [DATA_FILE]: stored });
			const applied: number[] = [];
			const migrator = new Migrator(store, [
				createMigration(1, async () => {
					applied.push(1);
				}),
			]);

			await migrator.run();

			expect(applied).toEqual([1]);
			expect(store.get(DATA_FILE)).toEqual({ version: 1 });
		});

		it('should perform no work when the stored version is current', async () => {
			const stored = { version: 2, settings: { marker: '?' } };
			store = new MemoryDocumentStore({ [DATA_FILE]: stored });
			const applied: number[] = [];
			const migrator = new Migrator(store, [
				createMigration(1, async () => {
					applied.push(1);
				}),
				createMigration(2, async () => {
					applied.push(2);
				}),
			]);

			await migrator.run();

			expect(applied).toEqual([]);
			expect(store.operations).toEqual([]);
			expect(store.get(DATA_FILE)).toBe(stored);
		});

		it('should perform no work when the stored version is ahead of the catalog', async () => {
			store = new MemoryDocumentStore({ [DATA_FILE]: { version: 5 } });
			const migrator = new Migrator(store, [createMigration(1), createMigration(2)]);

			await migrator.run();

			expect(store.operations).toEqual([]);
			expect(store.get(DATA_FILE)).toEqual({ version: 5 });
		});

		it('should stamp nothing when the catalog is empty', async () => {
			const migrator = new Migrator(store, []);

			await migrator.run();

			expect(store.operations).toEqual([]);
		});
	});

	describe('catalog validation', () => {
		it.each([
			['a duplicate version', [1, 1]],
			['a gap', [1, 3]],
			['a version below 1', [0, 1]],
		])('should log %s and leave the store untouched', async (_label, versions) => {
			const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
			const migrator = new Migrator(
				store,
				versions.map((version) => createMigration(version)),
			);

			await expect(migrator.run()).resolves.toBeUndefined();

			expect(errorSpy).toHaveBeenCalled();
			expect(store.operations).toEqual([]);
			expect(store.has(DATA_FILE)).toBe(false);
		});
	});

	describe('failure policy', () => {
		it('should leave the store untouched when a migration throws', async () => {
			const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
			const migrator = new Migrator(store, [
				createMigration(1, async () => {
					throw new Error('boom');
				}),
			]);

			await expect(migrator.run()).resolves.toBeUndefined();

			expect(errorSpy).toHaveBeenCalledWith(
				'data migrations failed; stored data left untouched',
				expect.any(Error),
			);
			expect(store.operations).toEqual([]);
			expect(store.has(DATA_FILE)).toBe(false);
		});

		it('should not commit an earlier migration write when a later migration throws', async () => {
			vi.spyOn(Logger, 'error').mockImplementation(() => {});
			const migrator = new Migrator(store, [
				createMigration(1, async (context) => {
					context.write(DATA_FILE, { migrated: true });
				}),
				createMigration(2, async () => {
					throw new Error('boom');
				}),
			]);

			await migrator.run();

			expect(store.operations).toEqual([]);
			expect(store.has(DATA_FILE)).toBe(false);
		});

		it('should leave the store untouched when reading it fails', async () => {
			vi.spyOn(Logger, 'error').mockImplementation(() => {});
			vi.spyOn(store, 'read').mockRejectedValue(new Error('unreadable'));
			const migrator = new Migrator(store, [createMigration(1)]);

			await expect(migrator.run()).resolves.toBeUndefined();

			expect(store.operations).toEqual([]);
		});
	});
});

describe('readDataVersion', () => {
	it('should read a valid stored version', () => {
		expect(readDataVersion({ version: 3 })).toBe(3);
	});

	it('should read 0 for absent or invalid versions', () => {
		expect(readDataVersion(undefined)).toBe(0);
		expect(readDataVersion(null)).toBe(0);
		expect(readDataVersion('2')).toBe(0);
		expect(readDataVersion([1])).toBe(0);
		expect(readDataVersion({ version: 1.5 })).toBe(0);
		expect(readDataVersion({ version: -1 })).toBe(0);
	});
});
