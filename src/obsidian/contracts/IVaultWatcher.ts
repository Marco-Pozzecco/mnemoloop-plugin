/**
 * Vault file system event types
 */
export enum VaultEventType {
  MODIFY = 'modify',
  DELETE = 'delete',
  RENAME = 'rename'
}

/**
 * Represents a vault event
 */
export interface IVaultEvent {
  readonly id: string;
  readonly type: VaultEventType;
  readonly filePath: string;
  readonly oldPath: string | null;
  readonly timestamp: string;
  readonly isMarkdown: boolean;
}

/**
 * Configuration for vault watching behavior
 */
export interface IVaultWatcherConfig {
  watchDirectories: string[];
  watchTags: string[];
  ignoredDirectories: string[];
  debounceTimeoutMs: number;
  enableSoftDelete: boolean;
  softDeleteHours: number;
}

/**
 * Main interface for vault file system event handling
 */
export interface IVaultWatcher {
  /**
   * Initialize the vault watcher and start listening to events
   */
  initialize(): Promise<void>;

  /**
   * Stop watching vault events and cleanup resources
   */
  shutdown(): void;

  /**
   * Process a vault event (called by EventQueue after debouncing)
   * @param event - The vault event to process
   */
  processEvent(event: IVaultEvent): Promise<void>;

  /**
   * Update watcher configuration (called when settings change)
   * @param config - New configuration to apply
   */
  updateConfiguration(config: IVaultWatcherConfig): void;

  /**
   * Get current event queue status
   */
  getQueueStatus(): {
    queuedCount: number;
    isProcessing: boolean;
    lastEventTime: string | null;
  };
}
