// Vitest setup file
import { vi } from 'vitest';

// Polyfill window with timer functions for Node test environment
// Use getters so vi.useFakeTimers can intercept them
globalThis.window ??= {} as typeof globalThis.window;
for (const fn of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const) {
	// In a real DOM environment (jsdom) window already provides these and window ===
	// globalThis, so defining a getter here would recurse infinitely. Only polyfill
	// when they are missing (plain Node environment).
	if (fn in globalThis.window) continue;
	Object.defineProperty(globalThis.window, fn, {
		get: () => (globalThis as Record<string, unknown>)[fn],
		configurable: true,
	});
}

// Define build-time globals for tests
(globalThis as Record<string, unknown>).__DEV__ = true;
(globalThis as Record<string, unknown>).__LOG_LEVEL__ = 'OFF';

// Mock obsidian module
vi.mock('obsidian', () => ({
	// Notice is a class: new Notice(message)
	Notice: vi.fn().mockImplementation((message: string) => ({
		message,
	})),

	// Plugin base class
	Plugin: class MockPlugin {
		app = {
			vault: {
				adapter: {
					read: vi.fn<any, any>(),
					write: vi.fn<any, any>(),
					exists: vi.fn<any, any>(),
					list: vi.fn<any, any>(),
				},
				getFileByPath: vi.fn<any, any>(),
				getAbstractFileByPath: vi.fn<any, any>(),
				delete: vi.fn<any, any>(),
				create: vi.fn<any, any>(),
				getRoot: vi.fn<any, any>(),
				read: vi.fn<any, any>(),
				write: vi.fn<any, any>(),
				cachedRead: vi.fn<any, any>(),
				append: vi.fn<any, any>(),
				on: vi.fn<any, any>(),
			},
			fileManager: {
				trashFile: vi.fn<any, any>(),
				processFrontMatter: vi.fn<any, any>(),
			},
			workspace: {
				getLeaf: vi.fn<any, any>(),
				getRightLeaf: vi.fn<any, any>(),
				getActiveFile: vi.fn<any, any>(),
				getLeavesOfType: vi.fn<any, any>(),
				getMostRecentLeaf: vi.fn<any, any>(),
				iterateRootLeaves: vi.fn<any, any>(),
				createLeafInParent: vi.fn<any, any>(),
				on: vi.fn<any, any>(),
				revealLeaf: vi.fn<any, any>(),
			},
			metadataCache: {
				getFileCache: vi.fn<any, any>(),
				getFirstLinkpathDest: vi.fn<any, any>(),
			},
		};
		registerEvent = vi.fn();
		loadData = vi.fn();
		saveData = vi.fn();
		addCommand = vi.fn();
	},

	// Vault class
	Vault: class MockVault {
		adapter = {
			read: vi.fn<any, any>(),
			write: vi.fn<any, any>(),
			exists: vi.fn<any, any>(),
			list: vi.fn<any, any>(),
		};
		getFileByPath = vi.fn<any, any>();
		getAbstractFileByPath = vi.fn<any, any>();
		delete = vi.fn<any, any>();
		create = vi.fn<any, any>();
		getRoot = vi.fn<any, any>();
		read = vi.fn<any, any>();
		write = vi.fn<any, any>();
		cachedRead = vi.fn<any, any>();
		append = vi.fn<any, any>();
		on = vi.fn<any, any>();
	},

	// TFile class
	TFile: class MockTFile {
		extension: string;
		stat: { ctime: number; mtime: number; size: number };
		constructor(
			public path: string,
			public basename: string = '',
		) {
			this.extension = path.split('.').pop() || '';
			this.stat = { ctime: Date.now(), mtime: Date.now(), size: 0 };
		}
	},

	// TAbstractFile class
	TAbstractFile: class MockTAbstractFile {
		constructor(public path: string) {}
	},

	// TFolder class
	TFolder: class MockTFolder {
		constructor(
			public path: string,
			public children: any[] = [],
		) {}
	},

	// Workspace class
	Workspace: class MockWorkspace {
		getLeaf = vi.fn<any, any>();
		getRightLeaf = vi.fn<any, any>();
		getActiveFile = vi.fn<any, any>();
		getLeavesOfType = vi.fn<any, any>();
		getMostRecentLeaf = vi.fn<any, any>();
		iterateRootLeaves = vi.fn<any, any>();
		createLeafInParent = vi.fn<any, any>();
		on = vi.fn<any, any>();
		revealLeaf = vi.fn<any, any>();
	},

	// WorkspaceLeaf class
	WorkspaceLeaf: class MockWorkspaceLeaf {
		setViewState = vi.fn();
		getViewState = vi.fn();
		openFile = vi.fn();
	},

	// Menu class
	Menu: class MockMenu {
		addItem = vi.fn().mockReturnThis();
		showAtPosition = vi.fn();
	},

	// Editor class
	Editor: class MockEditor {
		getSelection = vi.fn().mockReturnValue('');
		replaceSelection = vi.fn();
		getValue = vi.fn().mockReturnValue('');
	},

	// MarkdownView class
	MarkdownView: class MockMarkdownView {
		file = null;
		leaf = null;
		constructor(_leaf?: unknown) {}
	},

	// MarkdownFileInfo interface (mocked as a plain object constructor)
	MarkdownFileInfo: class MockMarkdownFileInfo {
		file = null;
	},

	// MetadataCache class
	MetadataCache: class MockMetadataCache {
		getFileCache = vi.fn();
		getFirstLinkpathDest = vi.fn();
	},

	// Utility functions
	normalizePath: (path: string) => path,
	parseYaml: vi.fn((_yaml: string) => ({})),

	// Component base class
	Component: class MockComponent {
		registerEvent = vi.fn();
	},

	// Platform object
	Platform: {
		isMobile: false,
	},

	// View base classes
	Modal: class MockModal {
		constructor(_app: unknown) {}
		open = vi.fn();
		close = vi.fn();
		onOpen = vi.fn();
		onClose = vi.fn();
	},

	ItemView: class MockItemView {
		contentEl: HTMLElement;
		constructor(_leaf?: unknown) {
			this.contentEl = {} as HTMLElement;
		}
		getViewType = vi.fn().mockReturnValue('');
		getDisplayText = vi.fn().mockReturnValue('');
		getIcon = vi.fn().mockReturnValue('');
		onOpen = vi.fn();
		onClose = vi.fn();
	},

	App: class MockApp {
		workspace = {
			getLeaf: vi.fn(),
			getLeavesOfType: vi.fn(() => []),
			getActiveFile: vi.fn(),
		};
		vault = {
			getFiles: vi.fn(() => []),
			read: vi.fn(),
			getAbstractFileByPath: vi.fn(),
		};
		metadataCache = {
			getFileCache: vi.fn(),
			getFirstLinkpathDest: vi.fn(),
		};
	},

	PluginSettingTab: class MockPluginSettingTab {
		constructor(_app: unknown, _plugin: unknown) {}
		display = vi.fn();
		hide = vi.fn();
	},

	MarkdownRenderer: {
		render: vi.fn(),
		renderer: vi.fn(),
	},

	setIcon: vi.fn(),
}));
