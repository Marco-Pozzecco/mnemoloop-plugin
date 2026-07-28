import { Logger } from '@/utils/Logger';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Plugin, parseYaml } from 'obsidian';
import { BaseWriter } from '@/modules/writers/BaseWriter';
import { IEntityParser } from '@/interfaces/parser/IEntityParser';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

interface TestEntity {
	[key: string]: unknown;
	uuid: string;
	tags?: string[];
	content: TestBody;
}

interface TestMetadata {
	[key: string]: unknown;
	uuid: string;
	tags?: string[];
}
type TestBody = string;

class TestWriter extends BaseWriter<TestEntity, TestMetadata, TestBody> {
	constructor(plugin: Plugin, parser: IEntityParser<TestEntity, TestMetadata, TestBody>) {
		super(plugin, parser);
	}
	extractMetadata = (entity: TestEntity) => ({ uuid: entity.uuid });
	extractBody = (entity: TestEntity) => entity.content;
	getMetadataKeys = () => ['uuid', 'tags'];
}

describe('BaseWriter', () => {
	let plugin: ReturnType<typeof createMockPlugin>;
	let writer: TestWriter;

	beforeEach(() => {
		plugin = createMockPlugin([{ path: 'test.md', content: '---\nuuid: old\n---\nold body' }]);
		const parser: IEntityParser<TestEntity, TestMetadata, TestBody> = {
			serializeContent: vi.fn().mockImplementation((body: string) => ({
				entity: body,
				success: true,
			})),
			serializeEntity: vi.fn().mockImplementation((entity: TestEntity) => ({
				entity: `---\nuuid: ${entity.uuid}\n---\n${entity.content}`,
				success: true as const,
			})),
			parseFile: vi.fn().mockResolvedValue({
				entity: { uuid: 'old', content: 'old body' },
				stats: { created_at: '', updated_at: '' },
				filepath: 'test.md',
				success: true,
			}),
		} as unknown as IEntityParser<TestEntity, TestMetadata, TestBody>;
		writer = new TestWriter(plugin as unknown as Plugin, parser);
		vi.spyOn(Logger, 'error').mockImplementation(() => {});
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
		it('should write a new file with full frontmatter and body in one atomic call', async () => {
			await writer.create('new.md', { uuid: 'new', content: 'hello world' });
			expect(plugin.app.vault.create).toHaveBeenCalledWith(
				'new.md',
				'---\nuuid: new\n---\nhello world',
			);
			expect(plugin.app.fileManager.processFrontMatter).not.toHaveBeenCalled();
		});

		it('should call vault.create when file does not exist', async () => {
			await writer.create('new.md', { uuid: 'test', content: 'body' });
			expect(plugin.app.vault.create).toHaveBeenCalledWith('new.md', expect.any(String));
		});

		it('should throw if file already exists', async () => {
			await writer.create('test.md', { uuid: 'new', content: 'hello' });
			expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('File already exists'));
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
			await writer.update('missing.md', { uuid: 'new', content: 'hello' });
			expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('File not found'));
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
			await writer.updateBody('test.md', 'new body');
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
			expect(plugin.app.fileManager.trashFile).toHaveBeenCalled();
		});

		it('should throw if file not found', async () => {
			await writer.delete('missing.md');
			expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('File not found'));
		});
	});
	describe('removeFrontmatter', () => {
		it('should handle frontmatter ending with --- and no trailing newline', () => {
			const content = '---\nkey: val\n---more body';
			const result = (writer as any).removeFrontmatter(content);
			expect(result).toBe('more body');
		});
	});
});
