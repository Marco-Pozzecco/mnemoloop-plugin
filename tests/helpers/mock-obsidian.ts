import { vi } from 'vitest';

export interface MockFile {
	path: string;
	content: string;
}

/**
 * Create a mock Vault with configurable adapter methods.
 * A file map is maintained for convenient read/write/exists/list operations.
 */
export function createMockVault(files: MockFile[] = []) {
	const fileMap = new Map<string, string>(files.map((f) => [f.path, f.content]));

	return {
		adapter: {
			read: vi.fn().mockImplementation(async (path: string) => {
				const content = fileMap.get(path);
				if (content === undefined) {
					throw new Error(`File not found: ${path}`);
				}
				return content;
			}),
			write: vi.fn().mockImplementation(async (path: string, content: string) => {
				fileMap.set(path, content);
			}),
			exists: vi.fn().mockImplementation(async (path: string) => fileMap.has(path)),
			list: vi.fn().mockImplementation(async (dirPath: string) => {
				const files = Array.from(fileMap.keys()).filter((f) => f.startsWith(dirPath));
				return { files };
			}),
		},
		getFileByPath: vi.fn(),
		getAbstractFileByPath: vi.fn().mockImplementation((path: string) => {
			if (!fileMap.has(path)) return null;
			const basename = path.split('/').pop()?.replace('.md', '') || '';
			return { path, basename };
		}),
		delete: vi.fn(),
		create: vi.fn(),
		getRoot: vi.fn(),
		on: vi.fn(),
	};
}

/**
 * Create a mock Workspace with configurable spies.
 */
export function createMockWorkspace() {
	return {
		getLeaf: vi.fn(),
		getRightLeaf: vi.fn(),
		on: vi.fn(),
		revealLeaf: vi.fn(),
	};
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
export function createMockMenu() {
	const items: Array<Record<string, unknown>> = [];

	return {
		addItem: vi.fn().mockImplementation((callback: (item: unknown) => void) => {
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
export function createMockEditor(value: string = '', selection: string = '') {
	return {
		getSelection: vi.fn().mockReturnValue(selection),
		replaceSelection: vi.fn(),
		getValue: vi.fn().mockReturnValue(value),
	};
}

/**
 * Create a mock MetadataCache with configurable frontmatter.
 */
export function createMockMetadataCache(frontmatter?: Record<string, unknown>) {
	return {
		getFileCache: vi.fn().mockReturnValue(
			frontmatter
				? {
						frontmatter,
						frontmatterPosition: null,
						headings: [],
						links: [],
						embeds: [],
						tags: [],
						blocks: {},
						sections: [],
					}
				: null,
		),
		getFirstLinkpathDest: vi.fn(),
	};
}

/**
 * Create a mock Plugin with app property containing vault, workspace, and metadataCache.
 */
export function createMockPlugin(files: MockFile[] = []) {
	const vault = createMockVault(files);
	const workspace = createMockWorkspace();
	const metadataCache = createMockMetadataCache();

	return {
		app: { vault, workspace, metadataCache },
		registerEvent: vi.fn(),
		loadData: vi.fn(),
		saveData: vi.fn(),
		addCommand: vi.fn(),
	};
}
