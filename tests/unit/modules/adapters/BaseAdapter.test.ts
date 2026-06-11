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
			await adapter.reset();
			expect(adapter.data).toEqual(defaultData);
		});
	});

	describe('initialize', () => {
		it('should load valid data', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 5 };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 5 });
			expect(adapter.savedData).toHaveLength(0);
		});

		it('should recover partial data', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 'invalid' };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 0 });
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should fall back to defaults on load error', async () => {
			adapter.loadDataShouldThrow = true;
			await adapter.initialize();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.savedData).toHaveLength(1);
			expect(adapter.savedData[0]).toEqual(defaultData);
		});
	});
});
