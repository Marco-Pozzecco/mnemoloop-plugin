import { describe, expect, it } from 'vitest';
import { Plugin } from 'obsidian';
import { z } from 'zod';
import { BaseYamlEngine } from '@/modules/yaml-engines/BaseYamlEngine';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

interface TestEntity {
	uuid: string;
	decks?: string[];
	status?: string;
}

class TestEngine extends BaseYamlEngine<TestEntity> {
	constructor() {
		super({} as Plugin, z.object({
			uuid: z.string(),
			decks: z.array(z.string()).optional(),
			status: z.string().optional(),
		}));
	}

	recover = async () => {};
}

// Engine with all-optional schema for tests that rely on parseYaml mock (returns {})
class TestEngineOptional extends BaseYamlEngine<TestEntity> {
	constructor(plugin: Plugin = {} as Plugin) {
		super(plugin, z.object({
			uuid: z.string().optional(),
			decks: z.array(z.string()).optional(),
			status: z.string().optional(),
		}));
	}

	recover = async () => {};
}

describe('BaseYamlEngine.encode', () => {
	const engine = new TestEngine();

	it('should omit undefined values from serialized YAML', () => {
		const yaml = engine.encode({ uuid: 'test-123' });
		expect(yaml).not.toContain('decks');
		expect(yaml).not.toContain('status');
		expect(yaml).toContain('uuid: test-123');
	});

	it('should include empty arrays in serialized YAML', () => {
		const yaml = engine.encode({ uuid: 'test-123', decks: [] });
		expect(yaml).toContain('decks: []');
		expect(yaml).toContain('uuid: test-123');
	});

	it('should include defined string values', () => {
		const yaml = engine.encode({ uuid: 'test-123', status: 'ACTIVE' });
		expect(yaml).toContain('status: ACTIVE');
		expect(yaml).toContain('uuid: test-123');
	});

	it('should include array values as JSON', () => {
		const yaml = engine.encode({ uuid: 'test-123', decks: ['Maths', 'CS'] });
		expect(yaml).toContain('decks: ["Maths","CS"]');
	});

	it('should produce valid frontmatter format with delimiters', () => {
		const yaml = engine.encode({ uuid: 'test-123' });
		expect(yaml).toMatch(/^---\n/);
		expect(yaml).toMatch(/\n---$/);
	});

	it('should mix defined and undefined values correctly', () => {
		const yaml = engine.encode({ uuid: 'test-123', decks: ['Maths'], status: undefined });
		expect(yaml).toContain('decks: ["Maths"]');
		expect(yaml).toContain('uuid: test-123');
		expect(yaml).not.toContain('status');
	});
});

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
		expect(() => engine.extractFmFromContent('no frontmatter here')).toThrow('Invalid YAML frontmatter');
	});
});

describe('BaseYamlEngine.removeFrontmatter', () => {
	it('should strip frontmatter from content', () => {
		const engine = new TestEngineOptional();
		const content = '---\nuuid: test\n---\nbody text';
		const result = engine.removeFrontmatter(content);
		expect(result).toBe('body text');
	});

	it('should return full content when no frontmatter present', () => {
		const engine = new TestEngineOptional();
		const content = 'just body text';
		const result = engine.removeFrontmatter(content);
		expect(result).toBe('just body text');
	});
});

describe('BaseYamlEngine.write', () => {
	it('should update frontmatter while preserving body', async () => {
		const plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nbody content' }]);
		const engine = new TestEngineOptional(plugin as unknown as Plugin);
		await engine.write('test.md', { uuid: 'new' });
		const written = await plugin.app.vault.adapter.read('test.md');
		expect(written).toContain('uuid: new');
		expect(written).toContain('body content');
	});
});
