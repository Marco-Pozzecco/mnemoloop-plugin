/**
 * Dependency Container Interface
 *
 * This contract defines the public API for the dependency injection container
 * used throughout the application for managing service dependencies.
 *
 * Purpose:
 * - Enable dependency injection for testability (FR-004)
 * - Manage singleton instances (reduce memory usage)
 * - Support loose coupling between components (SC-001)
 *
 * @see FR-004: System MUST provide a dependency injection container
 * @see US-004: Dependency Injection for Testability
 */

/**
 * Token type for registering and resolving services.
 * Can be a string (e.g., 'IndexManager') or a Symbol (for unique identification).
 */
export type ServiceToken = string | symbol;

/**
 * Factory function for creating service instances.
 * Returns a new instance of the service type T.
 *
 * @template T - The type of service to create
 * @returns A new instance of the service
 */
export type ServiceFactory<T> = () => T;

/**
 * Service registration options.
 *
 * @property lifecycle - Whether to create a new instance per resolve (transient) or reuse the same instance (singleton)
 * @property description - Optional human-readable description for debugging
 */
export interface ServiceRegistrationOptions {
  lifecycle: 'transient' | 'singleton';
  description?: string;
}

/**
 * Dependency Container Contract
 *
 * Provides registration and resolution of service dependencies with support for
 * both transient and singleton lifecycle management.
 *
 * Usage Example:
 * ```typescript
 * const container = new DependencyContainer();
 *
 * // Register singleton manager
 * container.registerSingleton('IndexManager', () => new IndexManager());
 *
 * // Register transient controller
 * container.register('DashboardController', () => new DashboardController(
 *   container.resolve('IndexManager'),
 *   container.resolve('StatisticsManager')
 * ));
 *
 * // Resolve dependency
 * const indexManager = container.resolve<IndexManager>('IndexManager');
 * ```
 */
export interface DependencyContainerContract {
  /**
   * Register a service with transient lifecycle.
   * A new instance will be created each time `resolve` is called.
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function to create the service instance
   * @param options - Registration options (default: transient lifecycle)
   *
   * @throws {Error} If a service with the same token is already registered
   */
  register<T>(
    token: ServiceToken,
    factory: ServiceFactory<T>,
    options?: Partial<ServiceRegistrationOptions>
  ): void;

  /**
   * Register a service with singleton lifecycle.
   * The same instance will be returned for all `resolve` calls.
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function to create the singleton instance
   * @param description - Optional human-readable description
   *
   * @throws {Error} If a service with the same token is already registered
   */
  registerSingleton<T>(
    token: ServiceToken,
    factory: ServiceFactory<T>,
    description?: string
  ): void;

  /**
   * Resolve a registered service.
   *
   * For transient services: Creates a new instance on each call.
   * For singleton services: Returns the cached instance.
   *
   * @param token - The token used during registration
   * @returns An instance of the requested service
   *
   * @throws {Error} If no service is registered with the given token
   * @throws {Error} If circular dependencies are detected during resolution
   */
  resolve<T>(token: ServiceToken): T;

  /**
   * Check if a service is registered.
   *
   * @param token - The token to check
   * @returns true if the service is registered, false otherwise
   */
  has(token: ServiceToken): boolean;

  /**
   * Clear all registered services and cached singleton instances.
   * This is typically used during application shutdown or testing.
   */
  clear(): void;
}

/**
 * Error thrown when a dependency cannot be resolved.
 */
export class DependencyResolutionError extends Error {
  constructor(token: ServiceToken) {
    super(
      `Dependency not found: ${typeof token === 'symbol' ? token.toString() : token}. ` +
      'Ensure the dependency is registered with the container.'
    );
    this.name = 'DependencyResolutionError';
  }
}

/**
 * Error thrown when circular dependencies are detected.
 */
export class CircularDependencyError extends Error {
  constructor(path: ServiceToken[]) {
    super(
      `Circular dependency detected: ${path.map(t => typeof t === 'symbol' ? t.toString() : t).join(' -> ')}`
    );
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when attempting to register a duplicate service.
 */
export class DuplicateRegistrationError extends Error {
  constructor(token: ServiceToken) {
    super(
      `Service already registered: ${typeof token === 'symbol' ? token.toString() : token}. ` +
      'Use a unique token or clear the container first.'
    );
    this.name = 'DuplicateRegistrationError';
  }
}

/**
 * Standard service tokens for common application services.
 * Using string tokens for better debuggability.
 */
export const ServiceTokens = {
  // Managers
  INDEX_MANAGER: 'IndexManager',
  STATISTICS_MANAGER: 'StatisticsManager',
  SESSION_MANAGER: 'SessionManager',
  SETTINGS_MANAGER: 'SettingsManager',
  QUEUE_MANAGER: 'QueueManager',

  // Controllers
  DASHBOARD_CONTROLLER: 'DashboardController',
  REVIEW_CONTROLLER: 'ReviewController',
  SETTINGS_CONTROLLER: 'SettingsController',

  // Stores
  APPLICATION_STORE: 'ApplicationStore',
  SESSION_STORE: 'SessionStore',
  SETTINGS_STORE: 'SettingsStore',
  UI_STORE: 'UIStore',

  // Infrastructure
  EVENT_BUS: 'EventBus',
  LOGGER: 'Logger',
  NOTIFICATION_MANAGER: 'NotificationManager',
} as const;

/**
 * Type-safe service token keys.
 */
export type ServiceTokenKey = (typeof ServiceTokens)[keyof typeof ServiceTokens];

/**
 * Container initialization options.
 *
 * @property enableCircularDependencyDetection - Enable detection of circular dependencies (default: true)
 * @property enableAutoRegistration - Auto-register services with decorators (default: false - requires build step)
 */
export interface ContainerOptions {
  enableCircularDependencyDetection?: boolean;
  enableAutoRegistration?: boolean;
}
