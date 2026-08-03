import type { IAdapter } from '@/interfaces/IAdapter';
import type { PluginSettings } from '@/schemas/settings';
import { normalizePath, Plugin, TAbstractFile, TFile } from 'obsidian';
import { EventBus } from '@/modules/events/core';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '@/modules/events/domains';

export class VaultWatcher {
	private _initialized = false;
	private _debounceTimers: Map<string, number> = new Map();

	constructor(
		private _plugin: Plugin,
		private _settingsAdapter: IAdapter<PluginSettings>,
	) {
		// Vault event registration is deferred to initialize()
		// so we don't receive the startup flood of Vault:Create
		// events for every existing file.
	}

	/**
	 * Register vault event handlers. MUST be called inside
	 * workspace.onLayoutReady() so that the startup flood
	 * of Vault:Create events for existing files is skipped.
	 * Safe to call multiple times — subsequent calls are no-ops.
	 */
	initialize(): void {
		if (this._initialized) return;
		this._initialized = true;
		this._registerVaultEvents();
	}

	/**
	 * Register vault event handlers via plugin.registerEvent()
	 * Obsidian handles automatic cleanup of these events on plugin unload
	 */
	private _registerVaultEvents(): void {
		this._plugin.registerEvent(
			this._plugin.app.vault.on('create', (file) => {
				this._handleCreate(file);
			}),
		);

		this._plugin.registerEvent(
			this._plugin.app.vault.on('modify', (file) => {
				this._handleModify(file);
			}),
		);

		this._plugin.registerEvent(
			this._plugin.app.vault.on('delete', (file) => {
				this._handleDelete(file);
			}),
		);

		this._plugin.registerEvent(
			this._plugin.app.vault.on('rename', (file, oldPath) => {
				this._handleRename(file, oldPath);
			}),
		);
	}

	/**
	 * Check if file should be watched based on extension, directory, and tags
	 */
	private _shouldWatchFile(file: TAbstractFile): boolean {
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return false;
		}

		if (this._isInWatchedDirectory(file.path)) return true;
		if (this._hasWatchedTags(file)) return true;

		return false;
	}

	/**
	 * Check if file is in watched directory (exact match, no subdirectories)
	 */
	private _isInWatchedDirectory(filepath: string): boolean {
		const normalizedPath = normalizePath(filepath);
		const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
		const watchedDir = normalizePath(this._getWatchedDirectory());
		return parentDir === watchedDir;
	}

	/**
	 * Check if file has watched tags using metadataCache
	 */
	private _hasWatchedTags(file: TFile): boolean {
		const watchedTags = this._getWatchedTags();
		if (watchedTags.length === 0) {
			return false;
		}

		const cache = this._plugin.app.metadataCache.getFileCache(file);
		if (!cache?.frontmatter?.tags) {
			return false;
		}

		const fileTags: unknown = cache.frontmatter.tags;
		const tagsArray = Array.isArray(fileTags) ? fileTags : [fileTags];

		for (const watchedTag of watchedTags) {
			if (tagsArray.includes(watchedTag.replace('#', ''))) {
				return true;
			}
		}

		return false;
	}

	private _getWatchedTags(): string[] {
		return this._settingsAdapter.data.flashcard.watch.tags;
	}

	private _getWatchedDirectory(): string {
		return this._settingsAdapter.data.flashcard.watch.directory;
	}

	private _getDebounceTimeout(): number {
		return this._settingsAdapter.data.debounce_timeout_ms;
	}

	private _clearDebounceTimer(filepath: string): void {
		const timer = this._debounceTimers.get(filepath);
		if (timer) {
			window.clearTimeout(timer);
			this._debounceTimers.delete(filepath);
		}
	}

	private _setDebounceTimer(filepath: string, callback: () => void): void {
		this._clearDebounceTimer(filepath);

		const timeout = this._getDebounceTimeout();
		const timer = window.setTimeout(() => {
			this._debounceTimers.delete(filepath);
			callback();
		}, timeout);

		this._debounceTimers.set(filepath, timer);
	}

	private _handleCreate(file: TAbstractFile): void {
		if (!this._shouldWatchFile(file)) {
			return;
		}

		this._setDebounceTimer(file.path, () => {
			void EventBus.instance.publish(
				new VaultCreateEvent({ path: file.path, entity: 'flashcard' }),
			);
		});
	}

	private _handleModify(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}

		const wasWatched = this._debounceTimers.has(file.path);
		const isWatched = this._shouldWatchFile(file);

		if (!isWatched && wasWatched) {
			this._clearDebounceTimer(file.path);
			return;
		}

		if (!isWatched) {
			return;
		}

		// if file has been created within 3 seconds ignore it
		const ctime = file.stat.ctime;
		const now = new Date().getTime();
		const diff = now - ctime;
		const threshold = 1000 * 3;

		if (diff < threshold) {
			return;
		}

		this._setDebounceTimer(file.path, () => {
			void EventBus.instance.publish(
				new VaultModifyEvent({ path: file.path, entity: 'flashcard' }),
			);
		});
	}

	private _handleDelete(file: TAbstractFile): void {
		this._clearDebounceTimer(file.path);

		if (!(file instanceof TFile) || file.extension !== 'md') {
			return;
		}

		if (!this._shouldWatchFile(file)) {
			return;
		}

		void EventBus.instance.publish(new VaultDeleteEvent({ path: file.path, entity: 'flashcard' }));
	}

	private _handleRename(file: TAbstractFile, oldPath: string): void {
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return;
		}

		const wasInWatchedDir = this._isInWatchedDirectory(oldPath);
		const isInWatchedDir = this._isInWatchedDirectory(file.path);
		const hasWatchedTags = this._hasWatchedTags(file);

		if (wasInWatchedDir || isInWatchedDir || hasWatchedTags) {
			void EventBus.instance.publish(
				new VaultRenameEvent({
					path: file.path,
					entity: 'flashcard',
					oldPath,
				}),
			);
		}

		this._clearDebounceTimer(oldPath);
	}

	/**
	 * Dispose and cleanup all timers
	 * Obsidian handles the vault event cleanup automatically via registerEvent()
	 */
	dispose(): void {
		for (const [, timer] of this._debounceTimers) {
			window.clearTimeout(timer);
		}
		this._debounceTimers.clear();
	}
}
