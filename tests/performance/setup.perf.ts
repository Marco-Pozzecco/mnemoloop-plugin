import { vi } from 'vitest';

function parseValue(raw: string): unknown {
	const value = raw.trim();
	if (!value) return '';
	try {
		return JSON.parse(value);
	} catch {
		if (
			(value.startsWith("'") && value.endsWith("'")) ||
			(value.startsWith('"') && value.endsWith('"'))
		) {
			return value.slice(1, -1);
		}
		return value;
	}
}

function parseFlatYaml(yaml: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const line of yaml.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf(':');
		if (separator <= 0) continue;
		result[trimmed.slice(0, separator).trim()] = parseValue(trimmed.slice(separator + 1));
	}
	return result;
}

// Polyfill window with timer functions for Node test environment.
globalThis.window ??= {} as typeof globalThis.window;
for (const fn of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const) {
	if (fn in globalThis.window) continue;
	Object.defineProperty(globalThis.window, fn, {
		get: () => (globalThis as Record<string, unknown>)[fn],
		configurable: true,
	});
}

(globalThis as Record<string, unknown>).__DEV__ = true;
(globalThis as Record<string, unknown>).__LOG_LEVEL__ = 'OFF';

vi.mock('obsidian', () => {
	class TAbstractFile {
		constructor(public path: string) {}
	}

	class TFile extends TAbstractFile {
		extension: string;
		stat: { ctime: number; mtime: number; size: number };

		constructor(path: string, public basename = '') {
			super(path);
			this.extension = path.split('.').pop() || '';
			const now = Date.now();
			this.stat = { ctime: now, mtime: now, size: 0 };
		}
	}

	class TFolder extends TAbstractFile {
		constructor(path: string, public children: TAbstractFile[] = []) {
			super(path);
		}
	}

	class Vault {
		adapter = {} as Record<string, unknown>;
		getFileByPath(..._args: unknown[]) {
			return null;
		}
		getAbstractFileByPath(..._args: unknown[]) {
			return null;
		}
		create(..._args: unknown[]) {
			return Promise.resolve(null);
		}
		read(..._args: unknown[]) {
			return Promise.resolve('');
		}
	}

	class Plugin {
		app: any = {
			vault: new Vault(),
			fileManager: { processFrontMatter: async () => undefined },
			workspace: {},
			metadataCache: {},
		};
		manifest = { dir: 'mnemoloop', name: 'Mnemoloop' };
		loadData = async () => undefined;
		saveData = async (_data: unknown) => undefined;
		addRibbonIcon = () => ({ remove: () => undefined });
		registerView = () => undefined;
		addSettingTab = () => undefined;
		registerHoverLinkSource = () => undefined;
		registerEvent = () => undefined;
		addCommand = () => undefined;
	}

	class Workspace {}
	class WorkspaceLeaf {}
	class Component {
		registerEvent = () => undefined;
		load = () => undefined;
		unload = () => undefined;
		addChild = (child: Component) => {
			child.load();
			return child;
		};
		removeChild = (child: Component) => {
			child.unload();
			return child;
		};
	}
	class Modal {
		constructor(_app: unknown) {}
	}
	class ItemView {}
	class PluginSettingTab {
		constructor(_app: unknown, _plugin: unknown) {}
	}
	class App {}
	class Menu {}
	class Editor {}
	class MarkdownView {}
	class MarkdownFileInfo {}
	class MetadataCache {}

	return {
		normalizePath: (value: string) => value,
		parseYaml: (value: string) => parseFlatYaml(value),
		TFile,
		TFolder,
		TAbstractFile,
		Vault,
		Plugin,
		Workspace,
		WorkspaceLeaf,
		Component,
		Modal,
		ItemView,
		PluginSettingTab,
		App,
		Menu,
		Editor,
		MarkdownView,
		MarkdownFileInfo,
		MetadataCache,
		Notice: class Notice {
			constructor(public message: string) {}
		},
		setIcon: () => undefined,
		Platform: { isMobile: false },
		MarkdownRenderer: { render: async () => undefined, renderer: () => undefined },
		getLinkpath: (value: string) => value.split('#')[0].split('|')[0],
	};
});
