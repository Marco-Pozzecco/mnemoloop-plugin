/**
 * EventBus for cross-component communication
 *
 * Provides type-safe event subscription and emission with:
 * - Automatic cleanup via unsubscribe functions
 * - Listener error isolation (errors in one listener don't affect others)
 * - Event constants for type safety
 *
 * @see FR-008: System MUST provide event bus pattern
 * @see research.md section 5: Event Bus for Cross-Component Communication
 */

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Application event constants
 */
export const AppEvents = {
	// Session events
	SESSION_STARTED: 'session:started',
	SESSION_COMPLETED: 'session:completed',
	SESSION_PAUSED: 'session:paused',
	SESSION_RESUMED: 'session:resumed',

	// Settings events
	SETTINGS_UPDATED: 'settings:updated',
	SETTINGS_RESET: 'settings:reset',

	// Card events
	CARD_RATED: 'card:rated',
	CARD_CREATED: 'card:created',
	CARD_UPDATED: 'card:updated',
	CARD_DELETED: 'card:deleted',

	// UI events
	THEME_CHANGED: 'ui:theme-changed',
	VIEW_CHANGED: 'ui:view-changed',

	// Queue events
	QUEUE_UPDATED: 'queue:updated',
	QUEUE_CLEARED: 'queue:cleared',

	// Statistics events
	STATISTICS_UPDATED: 'statistics:updated',
} as const;

/**
 * Type of application event names
 */
export type AppEventName = (typeof AppEvents)[keyof typeof AppEvents];

/**
 * EventBus class for event-driven architecture
 */
export class EventBus {
	private readonly listeners = new Map<string, Set<EventHandler>>();

	/**
	 * Subscribe to an event
	 *
	 * @param event - Event name to listen to
	 * @param handler - Function to call when event is emitted
	 * @returns Unsubscribe function to remove the listener
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = eventBus.on(AppEvents.SESSION_STARTED, (data) => {
	 *   console.log('Session started:', data);
	 * });
	 *
	 * // Later, when done listening
	 * unsubscribe();
	 * ```
	 */
	on<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(handler as EventHandler<unknown>);

		// Return unsubscribe function
		return () => this.off(event, handler as EventHandler<unknown>);
	}

	/**
	 * Unsubscribe from an event
	 *
	 * @param event - Event name to stop listening to
	 * @param handler - Handler function to remove
	 *
	 * @example
	 * ```typescript
	 * const handler = (data) => console.log(data);
	 * eventBus.on('my-event', handler);
	 * // ... later
	 * eventBus.off('my-event', handler);
	 * ```
	 */
	off(event: string, handler: EventHandler<unknown>): void {
		this.listeners.get(event)?.delete(handler);

		// Clean up empty event sets
		if (this.listeners.get(event)?.size === 0) {
			this.listeners.delete(event);
		}
	}

	/**
	 * Emit an event to all listeners
	 *
	 * @param event - Event name to emit
	 * @param data - Optional data to pass to listeners
	 *
	 * @example
	 * ```typescript
	 * eventBus.emit(AppEvents.SESSION_STARTED, { id: '123', startTime: Date.now() });
	 * ```
	 */
	emit<T = unknown>(event: string, data?: T): void {
		const handlers = this.listeners.get(event);

		if (!handlers || handlers.size === 0) {
			// Silently ignore events with no listeners (fire-and-forget)
			return;
		}

		// Create a copy to avoid issues if listeners modify the set during iteration
		const handlersArray = Array.from(handlers);

		for (const handler of handlersArray) {
			try {
				handler(data);
			} catch (error) {
				// Isolate listener errors to prevent affecting other listeners
				console.error(`Error in event handler for '${event}':`, error);
			}
		}
	}

	/**
	 * Clear all event listeners
	 *
	 * This is typically called during application shutdown or testing cleanup.
	 *
	 * @example
	 * ```typescript
	 * eventBus.clear(); // Remove all listeners
	 * ```
	 */
	clear(): void {
		this.listeners.clear();
	}

	/**
	 * Get the number of listeners for an event
	 *
	 * @param event - Event name
	 * @returns Number of listeners
	 */
	getListenerCount(event: string): number {
		return this.listeners.get(event)?.size ?? 0;
	}

	/**
	 * Check if an event has any listeners
	 *
	 * @param event - Event name
	 * @returns true if there are listeners for the event
	 */
	hasListeners(event: string): boolean {
		return this.getListenerCount(event) > 0;
	}

	/**
	 * Get all registered event names
	 *
	 * @returns Array of event names with listeners
	 */
	getRegisteredEvents(): string[] {
		return Array.from(this.listeners.keys());
	}

	/**
	 * Subscribe to an event once (auto-unsubscribe after first emission)
	 *
	 * @param event - Event name to listen to
	 * @param handler - Function to call once when event is emitted
	 * @returns Unsubscribe function (though it will auto-unsubscribe)
	 *
	 * @example
	 * ```typescript
	 * eventBus.once(AppEvents.SESSION_STARTED, (data) => {
	 *   console.log('First session started:', data);
	 * });
	 * ```
	 */
	once<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction {
		const wrappedHandler: EventHandler<unknown> = (data) => {
			handler(data as T);
			this.off(event, wrappedHandler);
		};

		return this.on(event, wrappedHandler);
	}
}
