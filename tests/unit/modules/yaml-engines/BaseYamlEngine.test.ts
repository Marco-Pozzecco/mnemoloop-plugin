import { describe, expect, it, vi } from 'vitest';
import { Plugin } from 'obsidian';
import { z } from 'zod';
import { BaseYamlEngine } from '@/modules/yaml-engines/BaseYamlEngine';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

interface TestEntity {
	[key: string]: unknown;
	uuid?: string;
	decks?: string[];
	status?: string;
}

// Engine with all-optional schema for tests that rely on parseYaml mock (returns {})
class TestEngineOptional extends BaseYamlEngine<TestEntity> {
	constructor(plugin: Plugin = {} as Plugin) {
		super(
			plugin,
			z.object({
				uuid: z.string().optional(),
				decks: z.array(z.string()).optional(),
				status: z.string().optional(),
			}),
		);
	}

	recover = async () => {};
}

describe('BaseYamlEngine.decode', () => {
	it('should parse yaml and validate against schema', () => {
		const engine = new TestEngineOptional();
		const result = engine.decode('uuid: test-123');
		expect(result).toEqual({}); // parseYaml mock returns {}, all fields optional
	});
});

describe('BaseYamlEngine.extractFmFromContent', () => {
	it('should extract frontmatter and body from content', () => {
		const engine = new TestEngineOptional();
		const content = '---\nuuid: test-123\n---\nbody text';
		const result = engine.extractFmFromContent(content);
		expect(result.fm).toEqual({}); // parseYaml mock returns {}
		expect(result.body).toBe('body text');
	});

	it('should throw INVALID_YAML when no frontmatter block found', () => {
		const engine = new TestEngineOptional();
		expect(() => engine.extractFmFromContent('no frontmatter here')).toThrow(
			'Invalid YAML frontmatter',
		);
	});
});

describe('BaseYamlEngine.removeFrontmatter', () => {
	it('should strip frontmatter from content', () => {
		const engine = new TestEngineOptional();
		const content = '---\nuuid: test\n---\nbody text';
		const result = (engine as any).removeFrontmatter(content);
		expect(result).toBe('body text');
	});

	it('should return full content when no frontmatter present', () => {
		const engine = new TestEngineOptional();
		const content = 'just body text';
		const result = (engine as any).removeFrontmatter(content);
		expect(result).toBe('just body text');
	});
});

describe('BaseYamlEngine.write', () => {
	it('should call processFrontMatter with validated data', async () => {
		const plugin = createMockPlugin([
			{ path: 'test.md', content: '---\nuuid: old\n---\nbody content' },
		]);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		await engine.write('test.md', { uuid: 'new' });
		expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
		const [fileArg] = plugin.app.fileManager.processFrontMatter.mock.calls[0];
		expect(fileArg.path).toBe('test.md');
	});
});
describe('BaseYamlEngine.extractFmFromFile', () => {
	it('should extract frontmatter via processFrontMatter and return validated data', async () => {
		const plugin = createMockPlugin([
			{ path: 'test.md', content: '---\nuuid: test\n---\nbody' },
		]);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		const result = await engine.extractFmFromFile('test.md');
		expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
		expect(result).toEqual({});
	});

	it('should throw file not found when file does not exist', async () => {
		const plugin = createMockPlugin([]);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		await expect(engine.extractFmFromFile('missing.md')).rejects.toThrow('file not found');
	});
});

describe('BaseYamlEngine.extractFmFromCache', () => {
	it('should extract frontmatter from metadataCache', () => {
		const plugin = createMockPlugin([]);
		plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({
			frontmatter: { uuid: 'test' },
		});
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue({ path: 'test.md' });
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		const result = engine.extractFmFromCache('test.md');
		expect(result).toEqual({ uuid: 'test' });
	});

	it('should throw file not found when file does not exist', () => {
		const plugin = createMockPlugin([]);
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue(null);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		expect(() => engine.extractFmFromCache('missing.md')).toThrow('file not found');
	});

	it('should throw Invalid YAML frontmatter when no frontmatter in cache', () => {
		const plugin = createMockPlugin([]);
		plugin.app.vault.getFileByPath = vi.fn().mockReturnValue({ path: 'test.md' });
		plugin.app.metadataCache.getFileCache = vi.fn().mockReturnValue({});
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		expect(() => engine.extractFmFromCache('test.md')).toThrow('Invalid YAML frontmatter');
	});
});

describe('BaseYamlEngine.encode', () => {
	it('should encode data into YAML frontmatter string', () => {
		const engine = new TestEngineOptional();
		const result = engine.encode({ uuid: 'test', status: 'active' });
		expect(result).toContain('---');
		expect(result).toContain('uuid: test');
		expect(result).toContain('status: active');
	});

	it('should skip undefined values', () => {
		const engine = new TestEngineOptional();
		const result = engine.encode({ uuid: 'test', status: undefined });
		expect(result).toContain('---');
		expect(result).toContain('uuid: test');
		expect(result).not.toContain('status');
	});
});

describe('BaseYamlEngine.write', () => {
	it('should throw file not found when file does not exist', async () => {
		const plugin = createMockPlugin([]);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		await expect(engine.write('missing.md', { uuid: 'test' })).rejects.toThrow('file not found');
	});
});
