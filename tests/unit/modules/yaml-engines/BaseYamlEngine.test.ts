import { describe, expect, it } from 'vitest';
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
