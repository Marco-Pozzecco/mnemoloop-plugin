/**
 * BaseController for UI controllers
 *
 * Abstract base class providing common functionality for all controllers:
 * - Lifecycle methods (initialize, dispose)
 * - Standardized error handling
 * - Built-in logging
 *
 * @see FR-003: System MUST provide base controller class
 * @see research.md section 3: Base Controller Pattern
 */

import type { EventBus } from '../infrastructure/EventBus';
import type { Logger } from '@/utils/Logger';

/**
 * Base controller class for UI controllers
 *
 * Controllers extending this class must implement initialize() and dispose()
 * lifecycle methods and have access to the executeWithErrorHandling wrapper.
 *
 * @example
 * ```typescript
 * class DashboardController extends BaseController {
 *   constructor(
 *     logger: Logger,
 *     eventBus: EventBus,
 *     private indexManager: IndexManager,
 *     private statisticsManager: StatisticsManager
 *   ) {
 *     super(logger, eventBus);
 *   }
 *
 *   async initialize() {
 *     this.logger.info('DashboardController initialized');
 *   }
 *
 *   async getStats() {
 *     return this.executeWithErrorHandling('Loading statistics', async () => {
 *       return await this.statisticsManager.getDashboardStats();
 *     });
 *   }
 *
 *   async dispose() {
 *     this.logger.info('DashboardController disposed');
 *   }
 * }
 * ```
 */
export abstract class BaseController {
	/**
	 * Logger instance for the controller
	 */
	protected logger: Logger;

	/**
	 * EventBus instance for cross-component communication
	 */
	protected eventBus: EventBus;

	/**
	 * Create a new BaseController
	 *
	 * @param logger - Logger instance for this controller
	 * @param eventBus - EventBus instance for cross-component communication
	 */
	constructor(logger: Logger, eventBus: EventBus) {
		this.logger = logger;
		this.eventBus = eventBus;
	}

	/**
	 * Initialize the controller
	 *
	 * Called when the controller is first created.
	 * Subclasses must implement this method to perform any setup logic.
	 */
	abstract initialize(): Promise<void>;

	/**
	 * Dispose of the controller
	 *
	 * Called when the controller is being destroyed.
	 * Subclasses must implement this method to perform cleanup (unsubscribe, close resources, etc.).
	 */
	abstract dispose(): Promise<void>;

	/**
	 * Execute an operation with error handling and logging
	 *
	 * This is a convenience wrapper that:
	 * 1. Executes the provided function
	 * 2. Catches any errors that occur
	 * 3. Logs the error with the provided operation name
	 * 4. Returns null on error (callers should check for null)
	 *
	 * @param operation - Description of the operation (for error messages)
	 * @param fn - Async function to execute
	 * @returns The result of the function, or null if an error occurred
	 *
	 * @example
	 * ```typescript
	 * async loadDashboard() {
	 *   const stats = await this.executeWithErrorHandling(
	 *     'Loading dashboard statistics',
	 *     async () => {
	 *       return await this.statisticsManager.getDashboardStats();
	 *     }
	 *   );
	 *
	 *   if (stats === null) {
	 *     // Handle error case
	 *     return;
	 *   }
	 *
	 *   // Use stats
	 *   this.updateDashboard(stats);
	 * }
	 * ```
	 */
	protected async executeWithErrorHandling<T>(
		operation: string,
		fn: () => Promise<T>,
	): Promise<T | null> {
		try {
			return await fn();
		} catch (error) {
			this.logger.error(`${operation} failed:`, error);
			return null;
		}
	}

	/**
	 * Execute a synchronous operation with error handling and logging
	 *
	 * Similar to executeWithErrorHandling but for synchronous operations.
	 *
	 * @param operation - Description of the operation (for error messages)
	 * @param fn - Synchronous function to execute
	 * @returns The result of the function, or null if an error occurred
	 *
	 * @example
	 * ```typescript
	 * getDueCardCount() {
	 *   return this.executeSyncWithErrorHandling(
	 *     'Getting due card count',
	 *     () => {
	 *       return this.queueManager.getDueCount();
	 *     }
	 *   );
	 * }
	 * ```
	 */
	protected executeSyncWithErrorHandling<T>(operation: string, fn: () => T): T | null {
		try {
			return fn();
		} catch (error) {
			this.logger.error(`${operation} failed:`, error);
			return null;
		}
	}

	/**
	 * Log the correlation ID for the current controller instance
	 *
	 * Useful for tracing requests and operations across the application.
	 * The correlation ID is maintained by the logger instance.
	 *
	 * @returns The correlation ID string
	 *
	 * @example
	 * ```typescript
	 * async processRequest() {
	 *   const cid = this.logCorrelationId();
	 *   console.log(`Processing request with correlation ID: ${cid}`);
	 *   // ... process request
	 * }
	 * ```
	 */
	logCorrelationId(): string {
		const cid = this.logger.getCorrelationId();
		this.logger.debug(`Correlation ID: ${cid}`);
		return cid;
	}
}
