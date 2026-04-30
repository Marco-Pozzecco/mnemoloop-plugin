import type { IAdapter } from '@/interfaces/IAdapter';
import { IEvent } from '@/interfaces/IEvent';
import type { IEventProcessor } from '@/interfaces/IEventProcessor';
import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import type { PluginSettings } from '@/schemas/settings';
import { AdapterKey } from '@/types/adapters';
import { ProcessorKey } from '@/types/processors';
import { normalizePath, Plugin, TAbstractFile, TFile } from 'obsidian';
import { EventBus } from '../core/EventBus';
import { EventRegistry } from '../core/EventRegistry';
import {
	FileWatcherCreateData,
	FlashcardWatcherCreateEvent,
	FileWatcherDeleteData,
	FlashcardWatcherDeleteEvent,
	FileWatcherModifyData,
	FlashcardWatcherModifyEvent,
	FileWatcherRenameData,
	FlashcardWatcherRenameEvent,
	WatcherAction,
	WatcherEntity,
} from '../domains/watcher';

export class FileWatcherProcessor implements IEventProcessor {
	private _debounceTimers: Map<string, NodeJS.Timeout> = new Map();

	static {
		EventRegistry.instance.register(
			ProcessorKey.fileWatcher,
			(deps: IEventRegistryDependencies) => {
				const settings = deps.adapters.get(AdapterKey.settings);
				if (!settings) {
					throw new Error('Settings adapter not found');
				}
				return new FileWatcherProcessor(deps.plugin, settings as IAdapter<PluginSettings>);
			},
		);
	}

	constructor(
		private _plugin: Plugin,
		private _settingsAdapter: IAdapter<PluginSettings>,
	) {
		this._registerVaultEvents();
	}

	private _emit(action: WatcherAction, entity: WatcherEntity, data: unknown): void {
		let event: IEvent | null = null;

		if (entity === WatcherEntity.Flashcard) {
			switch (action) {
				case WatcherAction.Create:
					event = new FlashcardWatcherCreateEvent(data as FileWatcherCreateData);
					break;
				case WatcherAction.Modify:
					event = new FlashcardWatcherModifyEvent(data as FileWatcherModifyData);
					break;
				case WatcherAction.Delete:
					event = new FlashcardWatcherDeleteEvent(data as FileWatcherDeleteData);
					break;
				case WatcherAction.Rename:
					event = new FlashcardWatcherRenameEvent(data as FileWatcherRenameData);
					break;
			}
		}

		if (event) {
			EventBus.instance.publish(event);
		}
	}

	/**
	 * Register vault event handlers via plugin.registerEvent()
	 * Obsidian handles automatic cleanup of these events on plugin unload
	 */
	private _registerVaultEvents(): void {
		// File create event
		this._plugin.registerEvent(
			this._plugin.app.vault.on('create', (file) => {
				this._handleCreate(file);
			}),
		);

		// File modify event (debounced)
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
	private _shouldWatchFile(file: TAbstractFile): WatcherEntity | false {
		// Check if file is a markdown file
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return false;
		}

		for (const entity of Object.values(WatcherEntity)) {
			// Check if file is in watched directories (exact match)
			if (this._isInWatchedDirectory(file.path, entity)) return entity;
			// Check if file has watched tags (using metadataCache)
			if (this._hasWatchedTags(file, entity)) return entity;
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
			case WatcherEntity.Flashcard:
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
			case WatcherEntity.Flashcard:
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
	 * Handle file create event
	 */
	private _handleCreate(file: TAbstractFile): void {
		const entity = this._shouldWatchFile(file);

		if (!entity) {
			return;
		}

		const data: FileWatcherCreateData = {
			path: file.path,
		};

		this._emit(WatcherAction.Create, entity, data);
	}

	/**
	 * Handle file modify event (debounced per-file)
	 */
	private _handleModify(file: TAbstractFile): void {
		// Check if file was previously watched (based on path)
		const wasWatched = this._debounceTimers.has(file.path);

		// Check if file should currently be watched
		const entity = this._shouldWatchFile(file);

		// If file moved out of watched area and was previously watched, treat as delete
		if (!entity && wasWatched) {
			this._clearDebounceTimer(file.path);
			return;
		}

		// If file shouldn't be watched, ignore
		if (!entity) {
			return;
		}

		// Debounce the modify event
		this._setDebounceTimer(file.path, () => {
			const data: FileWatcherModifyData = {
				path: file.path,
			};

			this._emit(WatcherAction.Modify, entity, data);
		});
	}

	/**
	 * Handle file delete event
	 */
	private _handleDelete(file: TAbstractFile): void {
		// Clear any pending debounce timer for this file
		this._clearDebounceTimer(file.path);

		// check if it was a markdown file
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return;
		}

		// check if it was a watched file
		const entity = this._shouldWatchFile(file);

		if (!entity) {
			return;
		}

		const data: FileWatcherDeleteData = {
			path: file.path,
		};

		this._emit(WatcherAction.Delete, entity, data);
	}

	/**
	 * Handle file rename event
	 */
	private _handleRename(file: TAbstractFile, oldPath: string): void {
		// Only handle markdown files
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return;
		}

		for (const entity of Object.values(WatcherEntity)) {
			// Check if old path was in watched directory
			const wasInWatchedDir = this._isInWatchedDirectory(oldPath, entity);

			// Check if new path is in watched directory
			const isInWatchedDir = this._isInWatchedDirectory(file.path, entity);

			// Check if file has watched tags (for the new file location)
			const hasWatchedTags = this._hasWatchedTags(file, entity);

			// Determine if we should publish a rename event
			// Publish if either old or new location was watched
			if (wasInWatchedDir || isInWatchedDir || hasWatchedTags) {
				const data: FileWatcherRenameData = {
					path: file.path,
					oldPath: oldPath,
				};
				this._emit(WatcherAction.Rename, entity, data);
			}
		}

		// Clear any debounce timer for the old path
		this._clearDebounceTimer(oldPath);
	}

	/**
	 * Dispose and cleanup all timers
	 * Obsidian handles the vault event cleanup automatically via registerEvent()
	 */
	dispose(): void {
		// Clear all debounce timers
		for (const [, timer] of this._debounceTimers) {
			clearTimeout(timer);
		}
		this._debounceTimers.clear();
	}
}
