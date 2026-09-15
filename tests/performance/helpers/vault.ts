import { TFile, TFolder, Vault } from 'obsidian';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import type { PerfCard, PerfFixture } from './fixture';

export interface PerfVault {
	vault: any;
	fileManager: any;
	writes: Map<string, string>;
	stats: { reads: number; writes: number; frontmatterParses: number; readPaths: string[] };
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

/** Supports only the flat JSON-looking frontmatter emitted by buildFixture. */
function parseFlatFrontmatter(content: string): Record<string, unknown> {
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

function delay(milliseconds: number): Promise<void> {
	return milliseconds > 0
		? new Promise((resolve) => setTimeout(resolve, milliseconds))
		: Promise.resolve();
}

function seededIndex(fixture: PerfFixture): string {
	const now = new Date().toISOString();
	return JSON.stringify({
		flashcards: fixture.cards.map((card: PerfCard) => ({
			uuid: card.uuid,
			source: null,
			status: 'ACTIVE',
			decks: [`deck-${parseInt(card.uuid.slice(-2), 16) % 20}`],
			card_type: 'basic',
			stability: 0,
			difficulty: 0,
			scheduled_days: 0,
			learning_steps: 0,
			reps: 0,
			lapses: 0,
			state: 0,
			last_review: null,
			due: card.due,
			file: card.path,
			created_at: now,
			updated_at: now,
		})),
		updated_at: now,
	});
}

export function createPerfVault(
	fixture: PerfFixture,
	opts: { seedIndex?: boolean; ioLatencyMs?: number } = {},
): PerfVault {
	const ioLatencyMs = opts.ioLatencyMs ?? 0;
	const contents = new Map(fixture.files);
	const files = new Map<string, any>();
	const writes = new Map<string, string>();
	const stats = { reads: 0, writes: 0, frontmatterParses: 0, readPaths: [] as string[] };
	const fileManager: any = {};

	for (const path of fixture.files.keys()) {
		const basename = path.slice(path.lastIndexOf('/') + 1, -3);
		const file = new (TFile as any)(path);
		file.basename = basename;
		file.stat.size = contents.get(path)?.length ?? 0;
		files.set(path, file);
	}

	const watchedFolder = new (TFolder as any)(fixture.dirPath);
	watchedFolder.children = [...files.values()];
	const directories = new Map<string, any>([[fixture.dirPath, watchedFolder]]);
	const indexPath = 'mnemoloop/flashcard-index.json';
	if (opts.seedIndex) contents.set(indexPath, fixture.indexJson ?? seededIndex(fixture));

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

	const vault: any = new Vault();
	vault.getFileByPath = (path: string) => files.get(path) ?? null;
	vault.getAbstractFileByPath = (path: string) => {
		return directories.get(path) ?? files.get(path) ?? null;
	};
	vault.read = (file: TFile) => read(file.path);
	vault.create = async (path: string, data: string) => {
		await write(path, data);
		return files.get(path) ?? new (TFile as any)(path);
	};
	vault.adapter = {
		read,
		write,
		exists: async (path: string) => {
			await delay(ioLatencyMs);
			return contents.has(path);
		},
	};

	fileManager.processFrontMatter = async (
		file: TFile,
		callback: (frontmatter: Record<string, unknown>) => void,
	) => {
		await delay(ioLatencyMs);
		stats.reads += 1;
		stats.readPaths.push(file.path);
		stats.frontmatterParses += 1;
		const frontmatter = parseFlatFrontmatter(contents.get(file.path) ?? '');
		callback(frontmatter);
	};

	return { vault, fileManager, writes, stats };
}

export function createPerfPlugin(vault: PerfVault, _fixture: PerfFixture): any {
	const plugin: any = {
		app: {
			vault: vault.vault,
			fileManager: vault.fileManager,
			workspace: {},
			metadataCache: { getFileCache: () => null },
		},
		manifest: { dir: 'mnemoloop', name: 'Mnemoloop' },
		loadData: async () => structuredClone(DEFAULT_PLUGIN_SETTINGS),
		saveData: async () => undefined,
		registerEvent: () => undefined,
		addRibbonIcon: () => ({ remove: () => undefined }),
		registerView: () => undefined,
		addSettingTab: () => undefined,
		registerHoverLinkSource: () => undefined,
	};
	return plugin;
}
