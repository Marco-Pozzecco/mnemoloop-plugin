import { IVaultEvent } from './IVaultWatcher';

/**
 * Callback type for processing queued events
 */
export type EventProcessor = (events: IVaultEvent[]) => Promise<void>;

/**
 * Event queue configuration
 */
export interface IEventQueueConfig {
  debounceTimeoutMs: number;
  maxQueueSize?: number;
}

/**
 * Status information for the event queue
 */
export interface IQueueStatus {
  queuedCount: number;
  isProcessing: boolean;
  lastEventTime: string | null;
  debounceActive: boolean;
}

/**
 * Interface for debounced event queue processing
 */
export interface IEventQueue {
  /**
   * Enqueue a vault event for processing
   * @param event - The event to queue
   */
  enqueue(event: IVaultEvent): void;

  /**
   * Process all queued events immediately (bypasses debounce)
   * Called on plugin unload or manual flush
   */
  flush(): Promise<void>;

  /**
   * Cancel the debounce timer without processing
   * Called when shutting down without processing
   */
  cancel(): void;

  /**
   * Get current queue status
   */
  getStatus(): IQueueStatus;

  /**
   * Set the event processor callback
   * @param processor - Async function that processes events
   */
  setProcessor(processor: EventProcessor): void;

  /**
   * Clear all queued events without processing
   */
  clear(): void;

  /**
   * Update queue configuration
   * @param config - New configuration
   */
  updateConfig(config: IEventQueueConfig): void;
}
