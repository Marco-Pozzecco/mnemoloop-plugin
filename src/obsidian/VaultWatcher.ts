import { App, TAbstractFile } from 'obsidian';
import { IIndexManager } from '../core/indexer/contracts/IIndexManager';
import { IEventQueue } from './contracts/IEventQueue';
import {
	IVaultEvent,
	IVaultWatcher,
	IVaultWatcherConfig,
	VaultEventType,
} from './contracts/IVaultWatcher';
import { EventQueue } from './EventQueue';

export class VaultWatcher implements IVaultWatcher {
	private app: App;
	private eventQueue: IEventQueue;
	private indexManager: IIndexManager;
	private config: IVaultWatcherConfig;

	constructor(app: App, indexManager: IIndexManager, config: IVaultWatcherConfig) {
		this.app = app;
		this.indexManager = indexManager;
		this.config = config;
		this.eventQueue = new EventQueue({
			debounceTimeoutMs: config.debounceTimeoutMs,
		});

		this.eventQueue.setProcessor(this.processEvents.bind(this));
	}

	async initialize(): Promise<void> {
		this.app.vault.on('modify', (file: TAbstractFile) => {
			if (this.shouldWatch(file)) {
				this.enqueueEvent(VaultEventType.MODIFY, file);
			}
		});

		this.app.vault.on('delete', (file: TAbstractFile) => {
			if (this.shouldWatch(file)) {
				this.enqueueEvent(VaultEventType.DELETE, file);
			}
		});

		this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
			if (this.shouldWatch(file) || (oldPath && this.shouldWatchPath(oldPath))) {
				this.enqueueEvent(VaultEventType.RENAME, file, oldPath);
			}
		});
	}

	private shouldWatch(file: any): boolean {
		if (file.extension !== 'md') return false;
		return this.shouldWatchPath(file.path);
	}

	private shouldWatchPath(path: string): boolean {
		const isIgnored = this.config.ignoredDirectories.some((dir) =>
			path.startsWith(dir.startsWith('/') ? dir.substring(1) : dir),
		);
		if (isIgnored) return false;

		const isInWatchedDir = this.config.watchDirectories.some((dir) => {
			if (dir === '/' || dir === '') return true;
			const normalizedDir = dir.startsWith('/') ? dir.substring(1) : dir;
			return path.startsWith(normalizedDir);
		});

		return isInWatchedDir;
	}

	private enqueueEvent(
		type: VaultEventType,
		file: TAbstractFile,
		oldPath: string | null = null,
	): void {
		const event: IVaultEvent = {
			id: crypto.randomUUID(),
			type,
			filePath: file.path,
			oldPath,
			timestamp: new Date().toISOString(),
			isMarkdown: file.name.endsWith('.md'),
		};
		this.eventQueue.enqueue(event);
	}

	shutdown(): void {
		this.eventQueue.flush().catch((err) => {
			console.error('Failed to flush event queue on shutdown:', err);
		});
	}

	async processEvent(event: IVaultEvent): Promise<void> {
		switch (event.type) {
			case VaultEventType.MODIFY:
				await this.handleModify(event);
				break;
			case VaultEventType.DELETE:
				await this.handleDelete(event);
				break;
			case VaultEventType.RENAME:
				await this.handleRename(event);
				break;
		}
	}

	private async handleModify(event: IVaultEvent): Promise<void> {
		const affectedCards = this.indexManager.findCardsBySource(event.filePath);
		for (const card of affectedCards) {
			const cardId = this.generateCardId(card.file);
			this.indexManager.upsertCard(cardId, { status: 'STALE' });
		}
	}

	private async handleDelete(event: IVaultEvent): Promise<void> {
		const affectedCards = this.indexManager.findCardsBySource(event.filePath);
		for (const card of affectedCards) {
			const cardId = this.generateCardId(card.file);
			this.indexManager.upsertCard(cardId, {
				status: 'DELETED',
				deleted_at: new Date().toISOString(),
			});
		}
	}

	private async handleRename(event: IVaultEvent): Promise<void> {
		if (!event.oldPath) return;

		const affectedCards = this.indexManager.findCardsBySource(event.oldPath);
		for (const card of affectedCards) {
			const cardId = this.generateCardId(card.file);
			this.indexManager.upsertCard(cardId, {
				source: event.filePath,
				updated: new Date().toISOString(),
			});
		}
	}

	private generateCardId(filePath: string): string {
		return filePath.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]/g, '-');
	}

	private async processEvents(events: IVaultEvent[]): Promise<void> {
		for (const event of events) {
			await this.processEvent(event);
		}
		await this.indexManager.save();
	}

	updateConfiguration(config: IVaultWatcherConfig): void {
		this.config = config;
		this.eventQueue.updateConfig({
			debounceTimeoutMs: config.debounceTimeoutMs,
		});
	}

	getQueueStatus() {
		const status = this.eventQueue.getStatus();
		return {
			queuedCount: status.queuedCount,
			isProcessing: status.isProcessing,
			lastEventTime: status.lastEventTime,
		};
	}
}
