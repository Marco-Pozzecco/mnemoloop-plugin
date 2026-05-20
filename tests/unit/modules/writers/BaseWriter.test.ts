import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Plugin, parseYaml } from 'obsidian';
import { z } from 'zod';
import { BaseWriter } from '@/modules/writers/BaseWriter';
import { BaseYamlEngine } from '@/modules/yaml-engines/BaseYamlEngine';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

interface TestEntity {
	[key: string]: unknown;
	uuid: string;
	content: string;
}

interface TestMetadata {
	[key: string]: unknown;
	uuid: string;
	tags?: string[];
}

interface TestBody {
	content: string;
}

class TestYamlEngine extends BaseYamlEngine<TestMetadata> {
	constructor(plugin: Plugin) {
		super(plugin, z.object({
			uuid: z.string(),
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
		vi.mocked(parseYaml).mockImplementation((yaml: string) => {
			const result: Record<string, unknown> = {};
			for (const line of yaml.split('\n')) {
				const colonIndex = line.indexOf(':');
				if (colonIndex > 0) {
					const key = line.slice(0, colonIndex).trim();
					const value = line.slice(colonIndex + 1).trim();
					if (key) result[key] = value;
				}
			}
			return result;
		});
	});

	afterEach(() => {
		vi.mocked(parseYaml).mockRestore();
	});

	describe('create', () => {
		it('should write a new file with body via vault.create and add frontmatter via processFrontMatter', async () => {
			await writer.create('new.md', { uuid: 'new', content: 'hello world' });
			expect(plugin.app.vault.create).toHaveBeenCalledWith('new.md', 'hello world');
			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			const [fileArg] = plugin.app.fileManager.processFrontMatter.mock.calls[0];
			expect(fileArg.path).toBe('new.md');
		});

		it('should throw if file already exists', async () => {
			await expect(writer.create('test.md', { uuid: 'new', content: 'hello' })).rejects.toThrow(
				'File already exists',
			);
		});
	});

	describe('update', () => {
		it('should update frontmatter via processFrontMatter and body via vault.modify', async () => {
			await writer.update('test.md', { uuid: 'updated', content: 'new body' });
			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(2);
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				expect.objectContaining({ path: 'test.md' }),
				'new body',
			);
		});

		it('should throw if file does not exist', async () => {
			await expect(writer.update('missing.md', { uuid: 'new', content: 'hello' })).rejects.toThrow(
				'File not found',
			);
		});
	});

	describe('updateFrontmatter', () => {
		it('should update only frontmatter via processFrontMatter while preserving body', async () => {
			await writer.updateFrontmatter('test.md', { uuid: 'updated' });
			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			const file = plugin.app.vault.getAbstractFileByPath('test.md');
			const content = await plugin.app.vault.read(file);
			expect(content).toContain('old body');
		});
	});

	describe('updateBody', () => {
		it('should update only body via vault.modify while preserving frontmatter', async () => {
			await writer.updateBody('test.md', { content: 'new body' });
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				expect.objectContaining({ path: 'test.md' }),
				'new body',
			);
			expect(plugin.app.fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
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
