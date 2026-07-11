import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BaseIndexer } from '@/modules/indexers/BaseIndexer';
import type { IEntityParser } from '@/interfaces/parser/IEntityParser';
import type { ParseContentResult, ParseResult } from '@/interfaces/parser/utils';
import type { IAdapter } from '@/interfaces/IAdapter';
import type { PluginSettings } from '@/schemas';

interface TestYaml {
	uuid: string;
}

interface TestContent {
	name: string;
}

interface TestEntity extends TestYaml {
	content: TestContent;
}

interface TestMetadata {
	uuid: string;
	name: string;
}


type TestIndex = Record<string, TestMetadata>;

const mockParser = {
	parseFile: async (filepath: string) =>
		({
			entity: { uuid: 'test', content: { name: 'Test' } } as TestEntity,
			filepath,
			stats: { created_at: '', updated_at: '' },
			success: true,
		}) as ParseResult<TestEntity>,
	parseDir: async (_dirPath: string) => [] as ParseResult<TestYaml>[],
	parseEntity: (_content: string) =>
		({
			entity: { uuid: 'test', content: { name: 'Test' } } as TestEntity,
			success: true,
		}) as ParseContentResult<TestEntity>,
	parseContent: (_content: string) =>
		({
			entity: { name: 'Test' } as TestContent,
			success: true,
		}) as ParseContentResult<TestContent>,
	parseYaml: async (filepath: string) =>
		({
			entity: { uuid: 'test' } as TestYaml,
			filepath,
			stats: { created_at: '', updated_at: '' },
			success: true,
		}) as ParseResult<TestYaml>,
	parseYamlFromCache: (filepath: string) =>
		({
			entity: { uuid: 'test' } as TestYaml,
			filepath,
			stats: { created_at: '', updated_at: '' },
			success: true,
		}) as ParseResult<TestYaml>,
	parseYamlFromContent: (_content: string) =>
		({
			entity: { uuid: 'test' } as TestYaml,
			success: true,
		}) as ParseContentResult<TestYaml>,
	serializeEntity: (_entity: TestEntity) =>
		({ entity: '', success: true }) as ParseContentResult<string>,
	serializeContent: (_content: TestContent) =>
		({ entity: '', success: true }) as ParseContentResult<string>,
	serializeYaml: (_yaml: TestYaml) =>
		({ entity: '', success: true }) as ParseContentResult<string>,
} satisfies IEntityParser<TestEntity, TestYaml, TestContent>;

const mockSettingsAdapter: IAdapter<PluginSettings> = {
	data: {} as PluginSettings,
	set: () => {},
	setField: () => {},
	update: () => {},
	save: async () => {},
	reset: () => {},
	initialize: async () => {},
};

const mockIndexAdapter: IAdapter<TestIndex> = {
	data: {},
	set: () => {},
	setField: () => {},
	update: () => {},
	save: async () => {},
	reset: () => {},
	initialize: async () => {},
};

class TestIndexer extends BaseIndexer<TestEntity, TestMetadata, TestYaml, TestContent, TestIndex> {
	initialize = async () => {};
	save = async () => {};
	generateMetadata(data: TestEntity, filepath: string): TestMetadata {
		return { uuid: data.uuid, name: data.content.name };
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
	describe('size getter', () => {
		it('should return cache size', () => {
			expect(indexer.size).toBe(0);
			indexer.create('1', { uuid: '1', name: 'Test' });
			expect(indexer.size).toBe(1);
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
		it('should throw FAILED_TO_CREATE when cache.get returns undefined after set', () => {
			const failingCache = {
				set: vi.fn(),
				get: vi.fn().mockReturnValue(undefined),
				delete: vi.fn(),
				has: vi.fn().mockReturnValue(false),
			};
			const failingIndexer = new TestIndexer(mockParser, mockSettingsAdapter, mockIndexAdapter);
			failingIndexer['_cache'] = failingCache as any;
			expect(() => failingIndexer.create('id', { uuid: 'id', name: 'Test' })).toThrow(
				'Failed to create entity',
			);
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
		it('should throw FAILED_TO_UPDATE when cache.get returns undefined after set', () => {
			const failingCache = {
				set: vi.fn(),
				get: vi
					.fn()
					.mockReturnValueOnce({ uuid: 'id', name: 'Test' }) // first get in update
					.mockReturnValueOnce(undefined), // second get after set
				delete: vi.fn(),
				has: vi.fn().mockReturnValue(true),
			};
			const failingIndexer = new TestIndexer(mockParser, mockSettingsAdapter, mockIndexAdapter);
			failingIndexer['_cache'] = failingCache as any;
			expect(() => failingIndexer.update('id', { name: 'Updated' })).toThrow(
				'Failed to update entity',
			);
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
