// Vitest setup file
import { vi } from 'vitest';

// Define build-time globals for tests
(globalThis as Record<string, unknown>).__DEV__ = true;

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
					read: vi.fn(),
					write: vi.fn(),
					exists: vi.fn(),
					list: vi.fn(),
				},
				getFileByPath: vi.fn(),
				getAbstractFileByPath: vi.fn(),
				delete: vi.fn(),
				create: vi.fn(),
				getRoot: vi.fn(),
				on: vi.fn(),
			},
			workspace: {
				getLeaf: vi.fn(),
				getRightLeaf: vi.fn(),
				on: vi.fn(),
				revealLeaf: vi.fn(),
			},
			metadataCache: {
				getFileCache: vi.fn(),
				getFirstLinkpathDest: vi.fn(),
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
			read: vi.fn(),
			write: vi.fn(),
			exists: vi.fn(),
			list: vi.fn(),
		};
		getFileByPath = vi.fn();
		getAbstractFileByPath = vi.fn();
		delete = vi.fn();
		create = vi.fn();
		getRoot = vi.fn();
		on = vi.fn();
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

	// Workspace class
	Workspace: class MockWorkspace {
		getLeaf = vi.fn();
		getRightLeaf = vi.fn();
		on = vi.fn();
		revealLeaf = vi.fn();
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
	parseYaml: (_yaml: string) => ({}),

	// Component base class
	Component: class MockComponent {
		registerEvent = vi.fn();
	},

	// Platform object
	Platform: {},
}));
