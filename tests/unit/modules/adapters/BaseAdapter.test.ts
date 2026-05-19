import { describe, expect, it, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseAdapter } from '@/modules/adapters/BaseAdapter';
import { AdapterAction } from '@/modules/events/domains/adapter';

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
	emitted: AdapterAction[] = [];
	savedData: TestData[] = [];
	loadDataResult: unknown = null;
	loadDataShouldThrow = false;

	emit = (action: AdapterAction) => {
		this.emitted.push(action);
	};

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
		it('should update data and emit Set', () => {
			adapter.set({ uuid: 'new', count: 5 });
			expect(adapter.data).toEqual({ uuid: 'new', count: 5 });
			expect(adapter.emitted).toContain(AdapterAction.Set);
		});

		it('should throw on invalid data', () => {
			expect(() => adapter.set({ uuid: 'new', count: 'invalid' as unknown as number })).toThrow();
		});
	});

	describe('update', () => {
		it('should merge partial data and emit Set and Update', () => {
			adapter.update({ count: 10 });
			expect(adapter.data).toEqual({ uuid: 'default', count: 10 });
			expect(adapter.emitted).toContain(AdapterAction.Set);
			expect(adapter.emitted).toContain(AdapterAction.Update);
		});
	});

	describe('setField', () => {
		it('should update a single field and emit Set and Update', () => {
			adapter.setField('uuid', 'new-uuid');
			expect(adapter.data).toEqual({ uuid: 'new-uuid', count: 0 });
			expect(adapter.emitted).toContain(AdapterAction.Set);
			expect(adapter.emitted).toContain(AdapterAction.Update);
		});
	});

	describe('save', () => {
		it('should persist data and emit Save', async () => {
			adapter.set({ uuid: 'new', count: 5 });
			await adapter.save();
			expect(adapter.savedData).toHaveLength(1);
			expect(adapter.savedData[0]).toEqual({ uuid: 'new', count: 5 });
			expect(adapter.emitted).toContain(AdapterAction.Save);
		});
	});

	describe('reset', () => {
		it('should restore default data and emit Set, Reset, Save', async () => {
			adapter.set({ uuid: 'new', count: 5 });
			adapter.emitted = [];
			await adapter.reset();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.emitted).toEqual([AdapterAction.Set, AdapterAction.Reset, AdapterAction.Save]);
		});
	});

	describe('initialize', () => {
		it('should load valid data and emit Init', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 5 };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 5 });
			expect(adapter.emitted).toContain(AdapterAction.Init);
			expect(adapter.savedData).toHaveLength(0);
		});

		it('should recover partial data and save', async () => {
			adapter.loadDataResult = { uuid: 'loaded', count: 'invalid' };
			await adapter.initialize();
			expect(adapter.data).toEqual({ uuid: 'loaded', count: 0 });
			expect(adapter.emitted).toContain(AdapterAction.Init);
			expect(adapter.emitted).toContain(AdapterAction.Save);
			expect(adapter.savedData).toHaveLength(1);
		});

		it('should fall back to defaults on load error', async () => {
			adapter.loadDataShouldThrow = true;
			await adapter.initialize();
			expect(adapter.data).toEqual(defaultData);
			expect(adapter.emitted).toContain(AdapterAction.Init);
			expect(adapter.savedData).toHaveLength(1);
			expect(adapter.savedData[0]).toEqual(defaultData);
		});
	});
});
