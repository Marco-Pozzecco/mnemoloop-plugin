import { vi } from 'vitest';
import { TFile, TFolder } from 'obsidian';
import type { TagCache } from 'obsidian';

export interface MockFile {
	path: string;
	content: string;
}

function removeFrontmatter(content: string): string {
	if (!content.startsWith('---\n')) {
		return content;
	}
	const endIndex = content.indexOf('\n---\n', 4);
	if (endIndex !== -1) {
		return content.slice(endIndex + 5);
	}
	const altEndIndex = content.indexOf('\n---', 4);
	if (altEndIndex !== -1) {
		const body = content.slice(altEndIndex + 4);
		return body.startsWith('\n') ? body.slice(1) : body;
	}
	return content;
}

function encodeFrontmatter(data: Record<string, unknown>): string {
	const lines: string[] = ['---'];
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined) continue;
		if (typeof value === 'object') {
			lines.push(`${key}: ${JSON.stringify(value)}`);
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	lines.push('---\n');
	return lines.join('\n');
}

/**
 * Create a mock Vault with configurable adapter methods.
 * A file map is maintained for convenient read/write/exists/list operations.
 */
export function createMockVault(files: MockFile[] = []): any {
	const fileMap = new Map<string, string>(files.map((f) => [f.path, f.content]));

	return {
		adapter: {
			read: vi.fn<any, any>().mockImplementation(async (path: string) => {
				const content = fileMap.get(path);
				if (content === undefined) {
					throw new Error(`File not found: ${path}`);
				}
				return content;
			}),
			write: vi.fn<any, any>().mockImplementation(async (path: string, content: string) => {
				fileMap.set(path, content);
			}),
			exists: vi.fn<any, any>().mockImplementation(async (path: string) => fileMap.has(path)),
			list: vi.fn<any, any>().mockImplementation(async (dirPath: string) => {
				const files = Array.from(fileMap.keys()).filter((f) => f.startsWith(dirPath));
				return { files };
			}),
		},
		getFileByPath: vi.fn<any, any>().mockImplementation((path: string) => {
			if (fileMap.has(path)) {
				const basename = path.split('/').pop()?.replace('.md', '') || '';
				return new (TFile as any)(path, basename);
			}
			return null;
		}),
		getAbstractFileByPath: vi.fn<any, any>().mockImplementation((path: string) => {
			if (fileMap.has(path)) {
				const basename = path.split('/').pop()?.replace('.md', '') || '';
				return new (TFile as any)(path, basename);
			}

			const prefix = path.endsWith('/') ? path : path + '/';
			const children: any[] = [];
			const seen = new Set<string>();
			for (const [filePath] of fileMap.entries()) {
				if (filePath.startsWith(prefix)) {
					const relative = filePath.slice(prefix.length);
					const firstSegment = relative.split('/')[0];
					if (firstSegment && !seen.has(firstSegment)) {
						seen.add(firstSegment);
						const childPath = prefix + firstSegment;
						const childBasename = firstSegment.replace('.md', '') || '';
						children.push(new (TFile as any)(childPath, childBasename));
					}
				}
			}

			if (children.length > 0) {
				return new (TFolder as any)(path, children);
			}

			return null;
		}),
		delete: vi.fn<any, any>().mockImplementation(async (file: any) => {
			fileMap.delete(file.path);
		}),
		create: vi.fn<any, any>().mockImplementation(async (path: string, content: string) => {
			fileMap.set(path, content);
			const basename = path.split('/').pop()?.replace('.md', '') || '';
			return new (TFile as any)(path, basename);
		}),
		getRoot: vi.fn<any, any>(),
		read: vi.fn<any, any>().mockImplementation(async (file: any) => {
			const content = fileMap.get(file.path);
			if (content === undefined) {
				throw new Error(`File not found: ${file.path}`);
			}
			return content;
		}),
		modify: vi.fn<any, any>().mockImplementation(async (file: any, content: string) => {
			fileMap.set(file.path, content);
		}),
		cachedRead: vi.fn<any, any>().mockImplementation(async (file: any) => {
			const content = fileMap.get(file.path);
			if (content === undefined) {
				throw new Error(`File not found: ${file.path}`);
			}
			return content;
		}),
		append: vi.fn<any, any>(),
		on: vi.fn<any, any>(),
		fileMap,
	} as any;
}

/**
 * Create a mock Workspace with configurable spies.
 */
export function createMockWorkspace(): any {
	return {
		getLeaf: vi.fn<any, any>(),
		getRightLeaf: vi.fn<any, any>(),
		getActiveFile: vi.fn<any, any>(),
		getLeavesOfType: vi.fn<any, any>(),
		getMostRecentLeaf: vi.fn<any, any>(),
		iterateRootLeaves: vi.fn<any, any>(),
		createLeafInParent: vi.fn<any, any>(),
		on: vi.fn<any, any>(),
		revealLeaf: vi.fn<any, any>(),
	} as any;
}

/**
 * Create a mock TFile-like object.
 * Use `new (await import('obsidian')).TFile(...)` for instanceof checks.
 */
export function createMockTFile(path: string, basename?: string) {
	const name = basename || path.split('/').pop()?.replace('.md', '') || '';
	return {
		path,
		basename: name,
		extension: path.split('.').pop() || '',
		stat: { ctime: Date.now(), mtime: Date.now(), size: 0 },
	};
}

/**
 * Create a mock Menu with configurable item callbacks.
 */
export function createMockMenu(): any {
	const items: any[] = [];

	return {
		addItem: vi.fn().mockImplementation((callback: (item: any) => void) => {
			const item = {
				setTitle: vi.fn().mockReturnThis(),
				setIcon: vi.fn().mockReturnThis(),
				onClick: vi.fn().mockReturnThis(),
			};
			callback(item);
			items.push(item);
			return item;
		}),
		showAtPosition: vi.fn(),
		_items: items,
	};
}

/**
 * Create a mock Editor with configurable selection and value.
 */
export function createMockEditor(value: string = '', selection: string = ''): any {
	return {
		getSelection: vi.fn().mockReturnValue(selection),
		replaceSelection: vi.fn(),
		getValue: vi.fn().mockReturnValue(value),
	};
}

/**
 * Create a mock MetadataCache with configurable frontmatter, complete tags,
 * resolved-link metadata, and link-target resolution.
 */
interface MockMethod {
	mockReturnValue(value: unknown): MockMethod;
}

interface MockMetadataCache {
	getFileCache: MockMethod;
	getFirstLinkpathDest: MockMethod;
	resolvedLinks: Record<string, Record<string, number>>;
}

export function createMockMetadataCache(
	frontmatter?: Record<string, unknown>,
	tags?: TagCache[],
	options: {
		resolvedLinks?: Record<string, Record<string, number>>;
		linkTargets?: Record<string, string>;
	} = {},
): MockMetadataCache {
	const hasCache = frontmatter !== undefined || tags !== undefined;
	return {
		getFileCache: vi.fn().mockReturnValue(
			hasCache
				? {
						frontmatter,
						frontmatterPosition: null,
						headings: [],
						links: [],
						embeds: [],
						tags,
						blocks: {},
						sections: [],
					}
				: null,
		),
		getFirstLinkpathDest: vi.fn().mockImplementation((linkpath: string) => {
			const target = options.linkTargets?.[linkpath];
			if (!target) {
				return null;
			}
			const basename = target.split('/').pop()?.replace('.md', '') || '';
			return new (TFile as any)(target, basename);
		}),
		resolvedLinks: options.resolvedLinks ?? {},
	};
}

/**
 * Create a mock Plugin with app property containing vault, workspace, and metadataCache.
 */
export function createMockPlugin(files: MockFile[] = []): any {
	const vault = createMockVault(files);
	const workspace = createMockWorkspace();
	const metadataCache = createMockMetadataCache();

	return {
		app: {
			vault,
			workspace,
			metadataCache,
			fileManager: {
				processFrontMatter: vi
					.fn()
					.mockImplementation(async (file: any, fn: (frontmatter: any) => void) => {
						const frontmatter: any = {};
						fn(frontmatter);
						// Persist frontmatter to file (simulates real Obsidian behavior)
						const currentContent = vault.fileMap.get(file.path) || '';
						const body = removeFrontmatter(currentContent);
						const yaml = encodeFrontmatter(frontmatter);
						vault.fileMap.set(file.path, yaml + body);
					}),
				trashFile: vi.fn().mockImplementation(async (file: any) => {
					vault.fileMap.delete(file.path);
				}),
			},
		},
		registerEvent: vi.fn(),
		loadData: vi.fn(),
		saveData: vi.fn(),
		addCommand: vi.fn(),
	} as any;
}
