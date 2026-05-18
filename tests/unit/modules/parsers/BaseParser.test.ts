import { describe, expect, it } from 'vitest';
import { Plugin } from 'obsidian';
import { BaseParser } from '@/modules/parsers/BaseParser';
import type { IYamlEngine } from '@/interfaces/IYamlEngine';
import type { ParseResult } from '@/interfaces/IParser';

interface TestEntity {
	uuid: string;
	content: string;
}

interface TestMetadata {
	uuid: string;
}

class TestYamlEngine implements IYamlEngine<TestMetadata> {
	encode = () => '---\nuuid: test\n---';
	decode = () => ({ uuid: 'test' });
	extractFmFromFile = async () => ({ uuid: 'test' });
	extractFmFromCache = () => ({ uuid: 'test' });
	extractFmFromContent = () => ({ fm: { uuid: 'test' }, body: '' });
	write = async () => {};
	recover = async () => {};
	validate = (data: Record<string, unknown>) => data as unknown as TestMetadata;
}

class TestParser extends BaseParser<TestEntity, TestMetadata> {
	marker = '#test';

	parse = async (filepath: string): Promise<ParseResult<TestEntity>> => ({
		entity: { uuid: 'test', content: '' },
		filepath,
	});

	parseContent = (content: string): Omit<ParseResult<TestEntity>, 'filepath'> => ({
		entity: { uuid: 'test', content },
	});

	parseMetadata = async (filepath: string): Promise<ParseResult<TestMetadata>> => ({
		entity: { uuid: 'test' },
		filepath,
	});

	parseAll = async (_dirPath: string): Promise<ParseResult<TestMetadata>[]> => [];
}

describe('BaseParser', () => {
	it('should store plugin reference on construction', () => {
		const plugin = {} as Plugin;
		const yaml = new TestYamlEngine();
		const parser = new TestParser(plugin, yaml);
		expect((parser as any)._plugin).toBe(plugin);
	});

	it('should store yaml engine reference on construction', () => {
		const plugin = {} as Plugin;
		const yaml = new TestYamlEngine();
		const parser = new TestParser(plugin, yaml);
		expect((parser as any)._yaml).toBe(yaml);
	});

	it('should expose marker from subclass', () => {
		const parser = new TestParser({} as Plugin, new TestYamlEngine());
		expect(parser.marker).toBe('#test');
	});
});
