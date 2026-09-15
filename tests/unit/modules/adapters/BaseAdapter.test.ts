import { describe, expect, it, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseAdapter } from '@/modules/adapters/BaseAdapter';

interface TestData {
	uuid: string;
	count: number;
}

const defaultData: TestData = { uuid: 'default', count: 0 };
const schema = z.object({
	uuid: z.string(),
	count: z.number(),
});

class TestAdapter extends BaseAdapter<TestData> {
	savedData: TestData[] = [];
	loadDataResult: unknown = null;
	loadDataShouldThrow = false;

	loadData = async () => {
		if (this.loadDataShouldThrow) {
			throw new Error('load error');
		}
		return this.loadDataResult;
	};

	saveData = async (data: TestData) => {
		this.savedData.push(data);
	};
}

describe('BaseAdapter', () => {
	let adapter: TestAdapter;

	beforeEach(() => {
		adapter = new TestAdapter(defaultData, schema);
	});

	describe('data getter', () => {
		it('should return current data', () => {
			expect(adapter.data).toEqual(defaultData);
		});
	});

	describe('set', () => {
		it('should update data', () => {
			adapter.set({ uuid: 'new', count: 5 });
			expect(adapter.data).toEqual({ uuid: 'new', count: 5 });
		});

		it('should throw on invalid data', () => {
			expect(() => adapter.set({ uuid: 'new', count: 'invalid' as unknown as number })).toThrow();
		});
	});

	describe('update', () => {
		it('should merge partial data', () => {
			adapter.update({ count: 10 });
			expect(adapter.data).toEqual({ uuid: 'default', count: 10 });
		});
	});

	describe('setField', () => {
		it('should update a single field', () => {
			adapter.setField('uuid', 'new-uuid');
			expect(adapter.data).toEqual({ uuid: 'new-uuid', count: 0 });
		});
	});
	describe('setValueAtPath array creation', () => {
		it('should create array when path index is numeric', () => {
			const adapter = new TestAdapter(
				{ uuid: 'default', count: 0 },
				z.object({
					uuid: z.string(),
					count: z.number(),
					tags: z.array(z.string()).optional(),
				}) as any,
			);
			(adapter as any).setValueAtPath(adapter.data, ['tags', 0], 'urgent');
			expect(adapter.data).toEqual({ uuid: 'default', count: 0, tags: ['urgent'] });
		});
	});

	describe('save', () => {
		it('should persist data', async () => {
			adapter.set({ uuid: 'new', count: 5 });
			await adapter.save();
			expect(adapter.savedData).toHaveLength(1);
			expect(adapter.savedData[0]).toEqual({ uuid: 'new', count: 5 });
		});
	});

	describe('reset', () => {
		it('should restore default data', async () => {
			adapter.set({ uuid: 'new', count: 5 });
			adapter.reset();
			expect(adapter.data).toEqual(defaultData);
		});
	});

	describe('initialize', () => {
		it('should not be initialized before initialize runs', () => {
			expect(adapter.initialized).toBe(false);
		});

		it('should load valid data', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 5 };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 5 });
			expect(adapter.savedData).toHaveLength(0);
			expect(adapter.initialized).toBe(true);
		});

		it('should recover partial data', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 'invalid' };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 0 });
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should use cloned defaults and persist them when no data is stored', async () => {
			adapter.loadDataResult = undefined;
			await adapter.initialize();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.savedData).toHaveLength(1);
			expect(adapter.savedData[0]).toEqual(defaultData);
		});

		it('should treat null from loadData as absent', async () => {
			adapter.loadDataResult = null;
			await adapter.initialize();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should fall back to defaults on load error without saving', async () => {
			adapter.loadDataShouldThrow = true;
			await adapter.initialize();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.savedData).toHaveLength(0);
			expect(adapter.initialized).toBe(true);
		});

		it('should keep a clone of the defaults when loading fails', async () => {
			adapter.loadDataShouldThrow = true;
			await adapter.initialize();
			adapter.data.count = 99;
			expect(defaultData.count).toBe(0);
		});

		it('should keep defaults in memory and not write when recovery cannot repair the data', async () => {
			const refinedSchema = schema.refine((data) => data.count >= 0, {
				message: 'count must be >= 0',
				path: [],
			});
			const unrecoverable = new TestAdapter(defaultData, refinedSchema);
			unrecoverable.loadDataResult = { uuid: 'stored', count: -1 };

			await unrecoverable.initialize();

			expect(unrecoverable.data).toEqual(defaultData);
			expect(unrecoverable.savedData).toHaveLength(0);
			expect(unrecoverable.initialized).toBe(true);
		});
	});

	describe('recoverPartialData', () => {
		const recoverySchema = z.object({
			label: z.string(),
			sessions: z.array(z.object({ id: z.string(), count: z.number() })),
			progress: z.record(z.string(), z.object({ total_count: z.number() })),
		});
		const recoveryDefaults = {
			label: 'default',
			sessions: [] as { id: string; count: number }[],
			progress: {} as Record<string, { total_count: number }>,
		};

		class RecoveryAdapter extends BaseAdapter<typeof recoveryDefaults> {
			savedData: (typeof recoveryDefaults)[] = [];
			loadDataResult: unknown = null;

			loadData = async () => this.loadDataResult;
			saveData = async (data: typeof recoveryDefaults) => {
				this.savedData.push(data);
			};
		}

		it('should drop only the invalid session and keep the rest', async () => {
			const adapter = new RecoveryAdapter(recoveryDefaults, recoverySchema);
			adapter.loadDataResult = {
				label: 'stored',
				sessions: [
					{ id: 'a', count: 1 },
					{ id: 'b', count: 'bad' },
					{ id: 'c', count: 3 },
				],
				progress: { '2026-08-19': { total_count: 2 } },
			};

			await adapter.initialize();

			expect(adapter.data.sessions).toEqual([
				{ id: 'a', count: 1 },
				{ id: 'c', count: 3 },
			]);
			expect(adapter.data.progress).toEqual({ '2026-08-19': { total_count: 2 } });
			expect(adapter.data.label).toBe('stored');
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should drop every invalid session by original index', async () => {
			const adapter = new RecoveryAdapter(recoveryDefaults, recoverySchema);
			adapter.loadDataResult = {
				label: 'stored',
				sessions: [
					{ id: 'a', count: 1 },
					{ id: 'b', count: 'bad' },
					{ id: 'c', count: 3 },
					{ id: 'd', count: 'bad' },
				],
				progress: {},
			};

			await adapter.initialize();

			expect(adapter.data.sessions).toEqual([
				{ id: 'a', count: 1 },
				{ id: 'c', count: 3 },
			]);
		});

		it('should drop only the invalid progress day and keep the rest', async () => {
			const adapter = new RecoveryAdapter(recoveryDefaults, recoverySchema);
			adapter.loadDataResult = {
				label: 'stored',
				sessions: [],
				progress: {
					'2026-08-19': { total_count: 2 },
					'2026-08-20': { total_count: 'bad' },
					'2026-08-21': { total_count: 4 },
				},
			};

			await adapter.initialize();

			expect(adapter.data.progress).toEqual({
				'2026-08-19': { total_count: 2 },
				'2026-08-21': { total_count: 4 },
			});
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should substitute the default for an invalid scalar', async () => {
			const adapter = new RecoveryAdapter(recoveryDefaults, recoverySchema);
			adapter.loadDataResult = {
				label: 42,
				sessions: [],
				progress: {},
			};

			await adapter.initialize();

			expect(adapter.data.label).toBe('default');
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should fall back to defaults without writing when data cannot be repaired', async () => {
			const unrecoverableSchema = recoverySchema.refine((data) => data.label !== '', {
				message: 'label must not be empty',
				path: [],
			});
			const adapter = new RecoveryAdapter(recoveryDefaults, unrecoverableSchema);
			adapter.loadDataResult = { label: '', sessions: [], progress: {} };

			await adapter.initialize();

			expect(adapter.data).toEqual(recoveryDefaults);
			expect(adapter.savedData).toHaveLength(0);
		});
	});
});
