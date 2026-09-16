import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationContext } from '@/modules/migration/_core/MigrationContext';
import { DATA_FILE, LEGACY_STATISTICS_FILE } from '@/modules/migration/_utils/documents';
import { MemoryDocumentStore } from '../../../helpers/memory-document-store';

const LEGACY_STATISTICS = { progress: {}, sessions: [], updated_at: '2026-01-01T00:00:00.000Z' };

describe('MigrationContext', () => {
	let store: MemoryDocumentStore;
	let context: MigrationContext;

	beforeEach(() => {
		store = new MemoryDocumentStore({ [LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS });
		context = new MigrationContext(store);
	});

	describe('read', () => {
		it('should return the stored document', async () => {
			await expect(context.read(LEGACY_STATISTICS_FILE)).resolves.toEqual(LEGACY_STATISTICS);
		});

		it('should return undefined for an absent document', async () => {
			await expect(context.read(DATA_FILE)).resolves.toBeUndefined();
		});

		it('should cache reads instead of hitting the store twice', async () => {
			const readSpy = vi.spyOn(store, 'read');

			await context.read(LEGACY_STATISTICS_FILE);
			await context.read(LEGACY_STATISTICS_FILE);

			expect(readSpy).toHaveBeenCalledTimes(1);
		});

		it('should observe a buffered write before commit', async () => {
			const envelope = { settings: {}, statistics: LEGACY_STATISTICS };
			context.write(DATA_FILE, envelope);

			await expect(context.read(DATA_FILE)).resolves.toEqual(envelope);
			expect(store.has(DATA_FILE)).toBe(false);
		});

		it('should observe a buffered removal before commit', async () => {
			context.remove(LEGACY_STATISTICS_FILE);

			await expect(context.read(LEGACY_STATISTICS_FILE)).resolves.toBeUndefined();
			expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
		});
	});

	describe('write and remove', () => {
		it('should buffer writes without touching the store', () => {
			context.write(DATA_FILE, { version: 1 });

			expect(store.operations).toEqual([]);
			expect(store.has(DATA_FILE)).toBe(false);
		});

		it('should buffer removals without touching the store', () => {
			context.remove(LEGACY_STATISTICS_FILE);

			expect(store.operations).toEqual([]);
			expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
		});

		it('should let a write cancel a buffered removal of the same document', async () => {
			context.remove(LEGACY_STATISTICS_FILE);
			context.write(LEGACY_STATISTICS_FILE, { replaced: true });

			await context.commit();

			expect(store.operations).toEqual([`write:${LEGACY_STATISTICS_FILE}`]);
			expect(store.get(LEGACY_STATISTICS_FILE)).toEqual({ replaced: true });
		});

		it('should let a removal cancel a buffered write of the same document', async () => {
			context.write(DATA_FILE, { version: 1 });
			context.remove(DATA_FILE);

			await context.commit();

			expect(store.operations).toEqual([`remove:${DATA_FILE}`]);
			expect(store.has(DATA_FILE)).toBe(false);
		});
	});

	describe('commit', () => {
		it('should commit nothing when no changes are buffered', async () => {
			await context.commit();

			expect(store.operations).toEqual([]);
		});

		it('should write changed documents before removing superseded ones', async () => {
			context.write(DATA_FILE, { version: 2 });
			context.remove(LEGACY_STATISTICS_FILE);

			await context.commit();

			expect(store.operations).toEqual([`write:${DATA_FILE}`, `remove:${LEGACY_STATISTICS_FILE}`]);
			expect(store.get(DATA_FILE)).toEqual({ version: 2 });
			expect(store.has(LEGACY_STATISTICS_FILE)).toBe(false);
		});

		it('should consume the buffer so a second commit performs no I/O', async () => {
			context.write(DATA_FILE, { version: 2 });

			await context.commit();
			await context.commit();

			expect(store.operations).toEqual([`write:${DATA_FILE}`]);
		});

		it('should skip removals when a write fails', async () => {
			const removeSpy = vi.spyOn(store, 'remove');
			vi.spyOn(store, 'write').mockRejectedValue(new Error('disk full'));
			context.write(DATA_FILE, { version: 2 });
			context.remove(LEGACY_STATISTICS_FILE);

			await expect(context.commit()).rejects.toThrow('disk full');

			expect(removeSpy).not.toHaveBeenCalled();
			expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
		});
	});
});
