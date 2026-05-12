import { describe, expect, it } from 'vitest';
import { Plugin } from 'obsidian';
import { z } from 'zod';
import { BaseYamlEngine } from '@/modules/yaml-engines/BaseYamlEngine';

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
