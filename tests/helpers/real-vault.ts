import { TFile, TFolder, Vault } from 'obsidian';
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from '@/schemas/settings';
import { DEFAULT_STATISTICS, type Stats } from '@/schemas/statistics';

/**
 * Browser-safe in-memory vault and plugin double used by the performance stack
 * and the playground. It imports neither `vitest` nor Node builtins; the only
 * external dependency is the `obsidian` module, which the test setup mocks and
 * the playground aliases to its browser implementation.
 */

/** Where `FlashcardAdapter` reads and writes the persisted index. */
export const STACK_INDEX_PATH = 'mnemoloop/flashcard-index.json';

/** Markdown files plus optional persisted settings and statistics. */
export interface RealStackFixture {
	files: Map<string, string>;
	dirPath?: string;
	settings?: Partial<PluginSettings>;
	statistics?: Partial<Stats>;
	/** Per-file vault timestamps, used by fixtures that need a creation history. */
	fileStats?: Map<string, { ctime?: number; mtime?: number }>;
	indexJson?: string | null;
}

export interface RealStackOptions {
	seedIndex?: boolean;
	ioLatencyMs?: number;
	/**
	 * Reset the EventBus/EventRegistry singletons before wiring. Tests want this;
	 * the playground must not, because module-level stores (stats, settings,
	 * banner) subscribe at import time, before the stack is built.
	 */
	resetEventSingletons?: boolean;
}

export interface VaultStats {
	reads: number;
	writes: number;
	frontmatterParses: number;
	readPaths: string[];
}

export interface RealVault {
	vault: any;
	fileManager: any;
	files: Map<string, any>;
	folders: Map<string, any>;
	contents: Map<string, string>;
	writes: Map<string, string>;
	stats: VaultStats;
	data: { settings: PluginSettings; statistics: Stats };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merges plain objects; arrays and scalars from the override replace the base. */
export function mergeDocuments<T>(base: T, override?: Partial<T>): T {
	const merged = structuredClone(base) as Record<string, unknown>;
	if (!override) return merged as T;

	for (const [key, value] of Object.entries(override)) {
		if (value === undefined) continue;
		if (isPlainObject(value) && isPlainObject(merged[key])) {
			merged[key] = mergeDocuments(merged[key], value as Record<string, unknown>);
		} else {
			merged[key] = structuredClone(value);
		}
	}

	return merged as T;
}

function parseFlatValue(raw: string): unknown {
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

/** Supports only the flat JSON-looking frontmatter fixtures are authored with. */
export function parseFlatFrontmatter(content: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
	if (!match) return result;
	for (const line of match[1].split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf(':');
		if (separator <= 0) continue;
		result[trimmed.slice(0, separator).trim()] = parseFlatValue(trimmed.slice(separator + 1));
	}
	return result;
}

function serializeFlatValue(value: unknown): string {
	if (value === undefined) return 'null';
	const serialized = JSON.stringify(value);
	return serialized === undefined ? 'null' : serialized;
}

function replaceFrontmatter(content: string, frontmatter: Record<string, unknown>): string {
	const lines = [
		'---',
		...Object.entries(frontmatter).map(([key, value]) => `${key}: ${serializeFlatValue(value)}`),
		'---',
	];
	const block = lines.join('\n');
	const match = content.match(/^---\n[\s\S]*?\n---/);
	return match ? block + content.slice(match[0].length) : `${block}\n${content}`;
}

function delay(milliseconds: number): Promise<void> {
	return milliseconds > 0
		? new Promise((resolve) => setTimeout(resolve, milliseconds))
		: Promise.resolve();
}

export function createRealVault(
	fixture: RealStackFixture,
	opts: RealStackOptions = {},
): RealVault {
	const ioLatencyMs = opts.ioLatencyMs ?? 0;
	const contents = new Map(fixture.files);
	const files = new Map<string, any>();
	const folders = new Map<string, any>();
	const writes = new Map<string, string>();
	const stats: VaultStats = { reads: 0, writes: 0, frontmatterParses: 0, readPaths: [] };

	const root = new (TFolder as any)('/');
	root.children = [];
	folders.set('/', root);

	const getFolder = (path: string): any => {
		const existing = folders.get(path);
		if (existing) return existing;
		const parentPath = path.slice(0, path.lastIndexOf('/')) || '/';
		const parent = getFolder(parentPath);
		const folder = new (TFolder as any)(path);
		folder.children = [];
		folders.set(path, folder);
		parent.children.push(folder);
		return folder;
	};

	for (const path of fixture.files.keys()) {
		const name = path.slice(path.lastIndexOf('/') + 1);
		const file = new (TFile as any)(path);
		file.name = name;
		file.basename = name.replace(/\.[^.]+$/, '');
		file.stat.size = contents.get(path)?.length ?? 0;
		const fileStat = fixture.fileStats?.get(path);
		if (fileStat?.ctime !== undefined) file.stat.ctime = fileStat.ctime;
		if (fileStat?.mtime !== undefined) file.stat.mtime = fileStat.mtime;
		files.set(path, file);
		const parentPath = path.slice(0, path.lastIndexOf('/')) || '/';
		getFolder(parentPath).children.push(file);
	}

	const watchedFolder = getFolder(fixture.dirPath ?? '/flashcards');
	void watchedFolder;
	if (opts.seedIndex) contents.set(STACK_INDEX_PATH, fixture.indexJson ?? '');

	const read = async (path: string): Promise<string> => {
		await delay(ioLatencyMs);
		stats.reads += 1;
		stats.readPaths.push(path);
		return contents.get(path) ?? '';
	};
	const write = async (path: string, data: string): Promise<void> => {
		await delay(ioLatencyMs);
		stats.writes += 1;
		contents.set(path, data);
		writes.set(path, data);
	};

	const remove = (file: any): void => {
		const parent = folders.get(file.parentPath);
		if (parent) {
			parent.children = parent.children.filter((child: any) => child !== file);
		}
		files.delete(file.path);
		contents.delete(file.path);
	};

	const resolvePath = (input: any): string => (typeof input === 'string' ? input : input.path);

	const vault: any = new (Vault as any)();
	vault.getFileByPath = (path: string) => files.get(path) ?? null;
	vault.getFolderByPath = (path: string) => folders.get(path) ?? null;
	vault.getAbstractFileByPath = (path: string) => folders.get(path) ?? files.get(path) ?? null;
	vault.getRoot = () => root;
	vault.getFiles = () => [...files.values()];
	vault.getMarkdownFiles = () =>
		[...files.values()].filter((file: any) => file.extension === 'md');
	vault.read = (input: any) => read(resolvePath(input));
	vault.cachedRead = (input: any) => read(resolvePath(input));
	vault.create = async (path: string, data: string) => {
		await write(path, data);
		const existing = files.get(path);
		if (existing) return existing;
		const name = path.slice(path.lastIndexOf('/') + 1);
		const file = new (TFile as any)(path);
		file.name = name;
		file.basename = name.replace(/\.[^.]+$/, '');
		file.stat.size = data.length;
		files.set(path, file);
		getFolder(path.slice(0, path.lastIndexOf('/')) || '/').children.push(file);
		return file;
	};
	vault.modify = async (input: any, data: string) => {
		await write(resolvePath(input), data);
	};
	vault.process = async (input: any, update: (data: string) => string) => {
		const path = resolvePath(input);
		const updated = update(await read(path));
		await write(path, updated);
		return updated;
	};
	vault.delete = async (input: any) => {
		remove(typeof input === 'string' ? files.get(input) : input);
	};
	vault.getResourcePath = (file: any) => `/${file.path}`;
	vault.on = () => ({});
	vault.offref = () => undefined;
	vault.adapter = {
		read,
		write,
		exists: async (path: string) => {
			await delay(ioLatencyMs);
			return contents.has(path);
		},
		list: async () => ({ files: [], folders: [] }),
	};

	const fileManager: any = {
		processFrontMatter: async (
			file: any,
			callback: (frontmatter: Record<string, unknown>) => void,
		) => {
			await delay(ioLatencyMs);
			stats.reads += 1;
			stats.readPaths.push(file.path);
			stats.frontmatterParses += 1;
			const content = contents.get(file.path) ?? '';
			const frontmatter = parseFlatFrontmatter(content);
			const before = JSON.stringify(frontmatter);
			callback(frontmatter);
			if (JSON.stringify(frontmatter) !== before) {
				contents.set(file.path, replaceFrontmatter(content, frontmatter));
			}
		},
		trashFile: async (file: any) => {
			await delay(ioLatencyMs);
			remove(file);
		},
		trash: async (file: any) => {
			remove(file);
		},
	};

	const data = {
		settings: mergeDocuments(DEFAULT_PLUGIN_SETTINGS, fixture.settings),
		statistics: mergeDocuments(DEFAULT_STATISTICS, fixture.statistics),
	};

	return { vault, fileManager, files, folders, contents, writes, stats, data };
}

/** Resolves a wiki-link style target against the in-memory files by path or basename. */
function createLinkpathResolver(vault: RealVault): (linkpath: string) => any {
	return (linkpath: string): any => {
		const cleaned = linkpath.split('|')[0].split('#')[0].trim().replace(/^\.?\//, '');
		if (!cleaned) return null;

		for (const candidate of [cleaned, `/${cleaned}`, `${cleaned}.md`, `/${cleaned}.md`]) {
			const file = vault.files.get(candidate);
			if (file) return file;
		}

		for (const file of vault.files.values()) {
			if (file.basename === cleaned || file.name === cleaned) return file;
		}
		return null;
	};
}

export function createRealPlugin(vault: RealVault, _fixture: RealStackFixture): any {
	const resolveLinkpath = createLinkpathResolver(vault);

	const metadataCache: any = {
		getFileCache: (file: any) => {
			if (!file?.path) return null;
			return { frontmatter: parseFlatFrontmatter(vault.contents.get(file.path) ?? '') };
		},
		getFirstLinkpathDest: (linkpath: string) => resolveLinkpath(linkpath),
		resolvedLinks: {},
	};

	const openLeaf = {
		openFile: async () => undefined,
		setViewState: async () => undefined,
		view: null,
	};

	const workspace: any = {
		getLeaf: () => openLeaf,
		getRightLeaf: () => null,
		getActiveFile: () => null,
		getLeavesOfType: () => [],
		getMostRecentLeaf: () => null,
		iterateRootLeaves: () => undefined,
		createLeafInParent: () => openLeaf,
		revealLeaf: async () => undefined,
		openLinkText: async () => undefined,
		trigger: () => undefined,
		on: () => ({}),
		off: () => undefined,
		offref: () => undefined,
		onLayoutReady: (callback: () => void) => callback(),
	};

	const plugin: any = {
		app: {
			vault: vault.vault,
			fileManager: vault.fileManager,
			workspace,
			metadataCache,
		},
		manifest: { id: 'mnemoloop', dir: 'mnemoloop', name: 'Mnemoloop', version: '0.0.0' },
		loadData: async () => structuredClone(vault.data),
		saveData: async (data: unknown) => {
			vault.data = data as RealVault['data'];
		},
		registerEvent: () => undefined,
		registerInterval: () => 0,
		registerDomEvent: () => undefined,
		addCommand: () => undefined,
		addRibbonIcon: () => ({ remove: () => undefined }),
		addStatusBarItem: () => ({ remove: () => undefined }),
		registerView: () => undefined,
		addSettingTab: () => undefined,
		registerHoverLinkSource: () => undefined,
	};
	return plugin;
}
