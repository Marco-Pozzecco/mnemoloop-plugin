import { describe, expect, it, beforeEach } from 'vitest';
import { Plugin } from 'obsidian';
import { z } from 'zod';
import { BaseWriter } from '@/modules/writers/BaseWriter';
import { BaseYamlEngine } from '@/modules/yaml-engines/BaseYamlEngine';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

interface TestEntity {
	uuid: string;
	content: string;
}

interface TestMetadata {
	uuid: string;
	tags?: string[];
}

interface TestBody {
	content: string;
}

class TestYamlEngine extends BaseYamlEngine<TestMetadata> {
	constructor(plugin: Plugin) {
		super(plugin, z.object({
			uuid: z.string().optional(),
			tags: z.array(z.string()).optional(),
		}));
	}
	recover = async () => {};
}

class TestWriter extends BaseWriter<TestEntity, TestMetadata, TestBody> {
	serializeBody = (body: TestBody) => body.content;
	deserializeBody = (content: string) => ({ content });
	extractMetadata = (entity: TestEntity) => ({ uuid: entity.uuid });
	extractBody = (entity: TestEntity) => ({ content: entity.content });
}

describe('BaseWriter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let writer: TestWriter;

	beforeEach(() => {
		plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nold body' }]);
		const yaml = new TestYamlEngine(plugin as unknown as Plugin);
		writer = new TestWriter(plugin as unknown as Plugin, yaml);
	});

	describe('create', () => {
		it('should write a new file with frontmatter and body', async () => {
			await writer.create('new.md', { uuid: 'new', content: 'hello world' });
			const content = await plugin.app.vault.adapter.read('new.md');
			expect(content).toContain('uuid: new');
			expect(content).toContain('hello world');
		});

		it('should throw if file already exists', async () => {
			await expect(writer.create('test.md', { uuid: 'new', content: 'hello' })).rejects.toThrow(
				'File already exists',
			);
		});
	});

	describe('update', () => {
		it('should overwrite an existing file with frontmatter and body', async () => {
			await writer.update('test.md', { uuid: 'updated', content: 'new body' });
			const content = await plugin.app.vault.adapter.read('test.md');
			expect(content).toContain('uuid: updated');
			expect(content).toContain('new body');
		});

		it('should throw if file does not exist', async () => {
			await expect(writer.update('missing.md', { uuid: 'new', content: 'hello' })).rejects.toThrow(
				'File not found',
			);
		});
	});

	describe('updateFrontmatter', () => {
		it('should update only frontmatter while preserving body', async () => {
			await writer.updateFrontmatter('test.md', { uuid: 'updated' });
			const content = await plugin.app.vault.adapter.read('test.md');
			expect(content).toContain('uuid: updated');
			expect(content).toContain('old body');
		});

		it('should wrap parse errors with friendly message', async () => {
			await plugin.app.vault.adapter.write('corrupt.md', 'no frontmatter');
			await expect(writer.updateFrontmatter('corrupt.md', { uuid: 'updated' })).rejects.toThrow(
				'Failed to parse frontmatter',
			);
		});
	});

	describe('updateBody', () => {
		it('should update only body while preserving frontmatter', async () => {
			await writer.updateBody('test.md', { content: 'new body' });
			const content = await plugin.app.vault.adapter.read('test.md');
			expect(content).toContain('new body');
		});

		it('should wrap parse errors with friendly message', async () => {
			await plugin.app.vault.adapter.write('corrupt.md', 'no frontmatter');
			await expect(writer.updateBody('corrupt.md', { content: 'new body' })).rejects.toThrow(
				'Failed to parse frontmatter',
			);
		});
	});

	describe('delete', () => {
		it('should delete an existing file', async () => {
			await writer.delete('test.md');
			expect(plugin.app.vault.delete).toHaveBeenCalled();
		});

		it('should throw if file not found', async () => {
			await expect(writer.delete('missing.md')).rejects.toThrow('File not found');
		});
	});
});
