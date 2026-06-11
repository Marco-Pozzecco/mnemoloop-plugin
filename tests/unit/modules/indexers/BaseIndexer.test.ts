import { describe, expect, it, beforeEach } from 'vitest';
import { BaseIndexer } from '@/modules/indexers/BaseIndexer';
import type { IParser, ParseResult } from '@/interfaces/IParser';
import type { IAdapter } from '@/interfaces/IAdapter';
import type { PluginSettings } from '@/schemas';

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
	set: () => {},
	setField: () => {},
	update: () => {},
	save: async () => {},
	reset: async () => {},
	initialize: async () => {},
};

const mockIndexAdapter: IAdapter<TestIndex> = {
	data: {},
	set: () => {},
	setField: () => {},
	update: () => {},
	save: async () => {},
	reset: async () => {},
	initialize: async () => {},
};

class TestIndexer extends BaseIndexer<TestEntity, TestMetadata, TestYaml, TestIndex> {
	initialize = async () => {};
	save = async () => {};
	generateMetadata(data: ParseResult<TestEntity>): TestMetadata {
		return data.entity;
	}
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

		it('should return entity', () => {
			indexer.create('1', { uuid: '1', name: 'Test' });
			const result = indexer.get('1');
			expect(result).toEqual({ uuid: '1', name: 'Test' });
		});
	});

	describe('getAll', () => {
		it('should return all entities', () => {
			indexer.create('1', { uuid: '1', name: 'A' });
			indexer.create('2', { uuid: '2', name: 'B' });
			const result = indexer.getAll();
			expect(result).toHaveLength(2);
		});
	});

	describe('query', () => {
		it('should return filtered entities', () => {
			indexer.create('1', { uuid: '1', name: 'Alice' });
			indexer.create('2', { uuid: '2', name: 'Bob' });
			const result = indexer.query((e) => e.name === 'Alice');
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Alice');
		});
	});

	describe('create', () => {
		it('should add entity to cache', () => {
			const result = indexer.create('1', { uuid: '1', name: 'Test' });
			expect(result).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.get('1')).toEqual({ uuid: '1', name: 'Test' });
		});
	});

	describe('update', () => {
		it('should merge data', () => {
			indexer.create('1', { uuid: '1', name: 'Old' });
			const result = indexer.update('1', { name: 'New' });
			expect(result).toEqual({ uuid: '1', name: 'New' });
		});

		it('should throw NOT_FOUND for missing entity', () => {
			expect(() => indexer.update('missing', { name: 'New' })).toThrow('Entity not found in index');
		});
	});

	describe('upsert', () => {
		it('should create when entity does not exist', () => {
			const result = indexer.upsert('1', { uuid: '1', name: 'Test' });
			expect(result).toEqual({ result: { uuid: '1', name: 'Test' }, operation: 'create' });
		});

		it('should update when entity exists', () => {
			indexer.create('1', { uuid: '1', name: 'Old' });
			const result = indexer.upsert('1', { uuid: '1', name: 'New' });
			expect(result).toEqual({ result: { uuid: '1', name: 'New' }, operation: 'update' });
		});
	});

	describe('delete', () => {
		it('should remove entity and return deleted entity', () => {
			indexer.create('1', { uuid: '1', name: 'Test' });
			const result = indexer.delete('1');
			expect(result).toEqual({ uuid: '1', name: 'Test' });
			expect(indexer.get('1')).toBeUndefined();
		});

		it('should throw NOT_FOUND for missing entity', () => {
			expect(() => indexer.delete('missing')).toThrow('Entity not found in index');
		});
	});
});
