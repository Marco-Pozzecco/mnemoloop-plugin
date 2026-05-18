import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BaseIndexer } from '@/modules/indexers/BaseIndexer';
import type { IParser, ParseResult } from '@/interfaces/IParser';
import type { IAdapter } from '@/interfaces/IAdapter';
import type { PluginSettings } from '@/schemas';
import { IndexAction } from '@/modules/events/domains/indexer';

interface TestEntity {
	uuid: string;
	name: string;
}

interface TestMetadata {
	uuid: string;
	name: string;
}

interface TestYaml {
	uuid: string;
}

type TestIndex = Record<string, TestMetadata>;

const mockParser: IParser<TestEntity, TestYaml> = {
	marker: '#test',
	parse: async (filepath) => ({ entity: { uuid: 'test', name: 'Test' }, filepath }),
	parseContent: (_content) => ({ entity: { uuid: 'test', name: 'Test' } }),
	parseMetadata: async (filepath) => ({ entity: { uuid: 'test' }, filepath }),
	parseAll: async (_dirPath) => [],
};

const mockSettingsAdapter: IAdapter<PluginSettings> = {
	data: {} as PluginSettings,
	set: vi.fn(),
	setField: vi.fn(),
	update: vi.fn(),
	save: async () => {},
	reset: async () => {},
	initialize: async () => {},
};

const mockIndexAdapter: IAdapter<TestIndex> = {
	data: {},
	set: vi.fn(),
	setField: vi.fn(),
	update: vi.fn(),
	save: async () => {},
	reset: async () => {},
	initialize: async () => {},
};

class TestIndexer extends BaseIndexer<TestEntity, TestMetadata, TestYaml, TestIndex> {
	emitted: Array<{ action: IndexAction; data?: unknown }> = [];

	initialize = async () => {};
	save = async () => {};
	emit = (action: IndexAction, data?: unknown) => {
		this.emitted.push({ action, data });
	};
	_generateMetadata = (data: ParseResult<TestEntity>) => data.entity;
}

describe('BaseIndexer', () => {
	let indexer: TestIndexer;

	beforeEach(() => {
		indexer = new TestIndexer(mockParser, mockSettingsAdapter, mockIndexAdapter);
	});

	describe('index getter', () => {
		it('should return empty object initially', () => {
			expect(indexer.index).toEqual({});
		});
	});

	describe('get', () => {
		it('should return undefined for missing id', () => {
			const result = indexer.get('missing');
			expect(result).toBeUndefined();
		});

		it('should return entity and emit Get event', () => {
			indexer.create('1', { uuid: '1', name: 'Test' });
			indexer.emitted = []; // clear create event
			const result = indexer.get('1');
			expect(result).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Get, data: { uuid: '1', name: 'Test' } });
		});
	});

	describe('getAll', () => {
		it('should return all entities and emit GetAll event', () => {
			indexer.create('1', { uuid: '1', name: 'A' });
			indexer.create('2', { uuid: '2', name: 'B' });
			indexer.emitted = []; // clear create events
			const result = indexer.getAll();
			expect(result).toHaveLength(2);
			expect(indexer.emitted).toContainEqual({
				action: IndexAction.GetAll,
				data: [{ uuid: '1', name: 'A' }, { uuid: '2', name: 'B' }],
			});
		});
	});

	describe('query', () => {
		it('should return filtered entities without emitting', () => {
			indexer.create('1', { uuid: '1', name: 'Alice' });
			indexer.create('2', { uuid: '2', name: 'Bob' });
			indexer.emitted = []; // clear create events
			const result = indexer.query((e) => e.name === 'Alice');
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Alice');
			expect(indexer.emitted).toHaveLength(0);
		});
	});

	describe('create', () => {
		it('should add entity to cache and emit Create event', () => {
			const result = indexer.create('1', { uuid: '1', name: 'Test' });
			expect(result).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.get('1')).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Create, data: { uuid: '1', name: 'Test' } });
		});
	});

	describe('update', () => {
		it('should merge data and emit Update event', () => {
			indexer.create('1', { uuid: '1', name: 'Old' });
			indexer.emitted = []; // clear create event
			const result = indexer.update('1', { name: 'New' });
			expect(result).toEqual({ uuid: '1', name: 'New' });
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Update, data: { uuid: '1', name: 'New' } });
		});

		it('should throw NOT_FOUND for missing entity', () => {
			expect(() => indexer.update('missing', { name: 'New' })).toThrow('entity not found in index');
		});
	});

	describe('upsert', () => {
		it('should create when entity does not exist', () => {
			const result = indexer.upsert('1', { uuid: '1', name: 'Test' });
			expect(result).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Create, data: { uuid: '1', name: 'Test' } });
		});

		it('should update when entity exists', () => {
			indexer.create('1', { uuid: '1', name: 'Old' });
			indexer.emitted = []; // clear create event
			const result = indexer.upsert('1', { uuid: '1', name: 'New' });
			expect(result).toEqual({ uuid: '1', name: 'New' });
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Update, data: { uuid: '1', name: 'New' } });
		});
	});

	describe('delete', () => {
		it('should remove entity, emit Delete before removal, and return success', () => {
			indexer.create('1', { uuid: '1', name: 'Test' });
			indexer.emitted = []; // clear create event
			const result = indexer.delete('1');
			expect(result).toBe(true);
			expect(indexer.get('1')).toBeUndefined();
			expect(indexer.emitted).toContainEqual({ action: IndexAction.Delete, data: { uuid: '1', name: 'Test' } });
		});

		it('should throw NOT_FOUND for missing entity', () => {
			expect(() => indexer.delete('missing')).toThrow('entity not found in index');
		});
	});
});
