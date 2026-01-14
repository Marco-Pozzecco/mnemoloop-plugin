import { App, TFile } from 'obsidian';
import { IVaultAdapter, CachedMetadata } from './contracts/IVaultAdapter';

export class VaultAdapter implements IVaultAdapter {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async readFile(path: string): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			return await this.app.vault.read(file);
		}
		throw new Error(`File not found: ${path}`);
	}

	async writeFile(path: string, content: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
		} else {
			await this.app.vault.create(path, content);
		}
	}

	async fileExists(path: string): Promise<boolean> {
		const file = this.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile;
	}

	async list(path: string): Promise<{ files: string[]; folders: string[] }> {
		const adapter = this.app.vault.adapter;
		const result = await adapter.list(path);
		return result;
	}

	async getCachedMetadata(path: string): Promise<CachedMetadata | null> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (metadata) {
				return {
					frontmatter: metadata.frontmatter,
					tags: metadata.tags?.map((t) => t.tag),
					links: metadata.links?.map((l) => ({
						link: l.link,
						original: l.original,
					})),
				};
			}
		}
		return null;
	}

	async deleteFile(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.vault.delete(file);
		}
	}
}
