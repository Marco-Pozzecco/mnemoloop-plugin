import type { IAdapter } from '@/interfaces/IAdapter';
import type { IEventListener } from '@/interfaces/IEventListener';
import { EventBus } from '@/modules/event-bus/EventBus';
import type { PluginSettings } from '@/schemas/settings';
import type { EventData } from '@/types/events';
import { WatcherEntity, WatcherEventType, WatcherFlashcardEventData } from '@/types/watcher';
import { Logger } from '@/utils/Logger';
import { normalizePath, Plugin, TAbstractFile, TFile } from 'obsidian';

export class FileWatcherListener implements IEventListener {
	private _debounceTimers: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private _plugin: Plugin,
		private _settingsAdapter: IAdapter<PluginSettings>,
	) {
		this._registerVaultEvents();
	}

	private _registerVaultEvents(): void {
		// File create event - Obsidian's registerEvent() handles cleanup automatically
		this._plugin.registerEvent(
			this._plugin.app.vault.on('create', (file) => {
				this._handleCreate(file);
			}),
		);

		// File modify event
		this._plugin.registerEvent(
			this._plugin.app.vault.on('modify', (file) => {
				this._handleModify(file);
			}),
		);

		// File delete event
		this._plugin.registerEvent(
			this._plugin.app.vault.on('delete', (file) => {
				this._handleDelete(file);
			}),
		);

		// File rename event
		this._plugin.registerEvent(
			this._plugin.app.vault.on('rename', (file, oldPath) => {
				this._handleRename(file, oldPath);
			}),
		);
	}

	/**
	 * Check if file should be watched based on extension, directories, and tags
	 */
	private _shouldWatchFile(file: TAbstractFile, entity: WatcherEntity): boolean {
		// Check if file is a markdown file
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return false;
		}

		// Check if file is in watched directories (exact match)
		if (this._isInWatchedDirectory(file.path, entity)) {
			return true;
		}

		// Check if file has watched tags (using metadataCache)
		if (this._hasWatchedTags(file, entity)) {
			return true;
		}

		return false;
	}

	/**
	 * Check if file is in watched directories (exact match, no subdirectories)
	 */
	private _isInWatchedDirectory(filepath: string, entity: WatcherEntity): boolean {
		const normalizedPath = normalizePath(filepath);
		const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';

		const watchedDir = this._getWatchedDirectory(entity);
		const normalizedWatched = normalizePath(watchedDir);

		return parentDir === normalizedWatched;
	}

	/**
	 * Check if file has watched tags using metadataCache (Option A)
	 */
	private _hasWatchedTags(file: TFile, entity: WatcherEntity): boolean {
		const watchedTags = this._getWatchedTags(entity);

		if (watchedTags.length === 0) {
			return false;
		}

		const cache = this._plugin.app.metadataCache.getFileCache(file);
		if (!cache?.frontmatter?.tags) {
			return false;
		}

		const fileTags = cache.frontmatter.tags;
		const tagsArray = Array.isArray(fileTags) ? fileTags : [fileTags];

		for (const watchedTag of watchedTags) {
			if (tagsArray.includes(watchedTag.replace('#', ''))) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get watched tags for an entity from settings
	 */
	private _getWatchedTags(entity: WatcherEntity): string[] {
		switch (entity) {
			case WatcherEntity.FLASHCARD:
				return this._settingsAdapter.data.flashcard.watch.tags;
			default:
				return [];
		}
	}

	/**
	 * Get watched directories for an entity from settings
	 */
	private _getWatchedDirectory(entity: WatcherEntity): string {
		switch (entity) {
			case WatcherEntity.FLASHCARD:
				return this._settingsAdapter.data.flashcard.watch.directory;
			default:
				return '';
		}
	}

	/**
	 * Get debounce timeout from settings
	 */
	private _getDebounceTimeout(): number {
		return this._settingsAdapter.data.debounce_timeout_ms;
	}

	/**
	 * Clear debounce timer for a file
	 */
	private _clearDebounceTimer(filepath: string): void {
		const timer = this._debounceTimers.get(filepath);
		if (timer) {
			clearTimeout(timer);
			this._debounceTimers.delete(filepath);
		}
	}

	/**
	 * Set debounce timer for a file
	 */
	private _setDebounceTimer(filepath: string, callback: () => void): void {
		// Clear existing timer if any
		this._clearDebounceTimer(filepath);

		// Set new timer
		const timeout = this._getDebounceTimeout();
		const timer = setTimeout(() => {
			this._debounceTimers.delete(filepath);
			callback();
		}, timeout);

		this._debounceTimers.set(filepath, timer);
	}

	/**
	 * Publish watcher event to EventBus
	 */
	private _publishEvent(eventType: WatcherEventType, data: WatcherFlashcardEventData): void {
		const event: EventData<WatcherFlashcardEventData> = {
			event_type: eventType,
			created_at: new Date(),
			data,
		};

		EventBus.instance.publish(event);
	}

	/**
	 * Handle file create event
	 */
	private _handleCreate(file: TAbstractFile): void {
		// Implementation to be added
		Logger.info('File created');
	}

	/**
	 * Handle file modify event (debounced per-file)
	 */
	private _handleModify(file: TAbstractFile): void {
		// Implementation to be added
		Logger.info('File modified');
	}

	/**
	 * Handle file delete event
	 */
	private _handleDelete(file: TAbstractFile): void {
		// Implementation to be added
		Logger.info('File deleted');
	}

	/**
	 * Handle file rename event
	 */
	private _handleRename(file: TAbstractFile, oldPath: string): void {
		// Implementation to be added
		Logger.info('File renamed');
	}

	/**
	 * Dispose and cleanup all event listeners and timers
	 */
	dispose(): void {
		// Clear all debounce timers
		for (const [filepath, timer] of this._debounceTimers) {
			clearTimeout(timer);
		}
		this._debounceTimers.clear();
		// Obsidian events registered with registerEvent are auto-cleaned by plugin
		// No need to manually unregister them
	}
}
