/**
 * Dependency Injection Container
 *
 * Provides service registration and resolution with support for:
 * - Singleton and transient lifecycles
 * - Circular dependency detection
 * - Type-safe service resolution
 *
 * @see FR-004: System MUST provide a dependency injection container
 * @see research.md section 1: Dependency Injection Container
 */

import type {
	CircularDependencyError,
	DependencyContainerContract,
	DependencyResolutionError,
	DuplicateRegistrationError,
	ServiceFactory,
	ServiceRegistrationOptions,
	ServiceToken,
} from './contracts/dependency-container.interface';

/**
 * Re-export types and errors from the contract
 */
export type {
	ServiceToken,
	ServiceFactory,
	ServiceRegistrationOptions,
	DependencyContainerContract,
} from './contracts/dependency-container.interface';

export {
	CircularDependencyError,
	DependencyResolutionError,
	DuplicateRegistrationError,
	ServiceTokens,
	type ContainerOptions,
	type ServiceTokenKey,
} from './contracts/dependency-container.interface';

/**
 * Internal service registration record
 */
interface ServiceRegistration<T = unknown> {
	factory: ServiceFactory<T>;
	lifecycle: 'singleton' | 'transient';
	description?: string;
	instance?: T;
	resolving?: boolean; // For circular dependency detection
}

/**
 * Dependency injection container implementation
 */
export class DependencyContainer implements DependencyContainerContract {
	private readonly registrations = new Map<ServiceToken, ServiceRegistration>();
	private readonly enableCircularDependencyDetection: boolean;

	/**
	 * Create a new DependencyContainer
	 *
	 * @param options - Container configuration options
	 */
	constructor(options: { enableCircularDependencyDetection?: boolean } = {}) {
		this.enableCircularDependencyDetection = options.enableCircularDependencyDetection ?? true;
	}

	/**
	 * Register a service with transient lifecycle
	 *
	 * A new instance will be created each time resolve is called.
	 *
	 * @param token - Unique identifier for the service
	 * @param factory - Factory function to create the service instance
	 * @param options - Registration options (default: transient lifecycle)
	 *
	 * @throws {DuplicateRegistrationError} If a service with the same token is already registered
	 *
	 * @example
	 * ```typescript
	 * container.register('DashboardController', () => new DashboardController(
	 *   container.resolve('IndexManager')
	 * ));
	 * ```
	 */
	register<T>(
		token: ServiceToken,
		factory: ServiceFactory<T>,
		options?: Partial<ServiceRegistrationOptions>
	): void {
		this.validateRegistration(token);

		const registration: ServiceRegistration<T> = {
			factory,
			lifecycle: options?.lifecycle ?? 'transient',
			description: options?.description,
		};

		this.registrations.set(token, registration);
	}

	/**
	 * Register a service with singleton lifecycle
	 *
	 * The same instance will be returned for all resolve calls.
	 *
	 * @param token - Unique identifier for the service
	 * @param factory - Factory function to create the singleton instance
	 * @param description - Optional human-readable description
	 *
	 * @throws {DuplicateRegistrationError} If a service with the same token is already registered
	 *
	 * @example
	 * ```typescript
	 * container.registerSingleton('IndexManager', () => new IndexManager());
	 * ```
	 */
	registerSingleton<T>(token: ServiceToken, factory: ServiceFactory<T>, description?: string): void {
		this.register(token, factory, {
			lifecycle: 'singleton',
			description,
		});
	}

	/**
	 * Resolve a registered service
	 *
	 * For transient services: Creates a new instance on each call.
	 * For singleton services: Returns the cached instance.
	 *
	 * @param token - The token used during registration
	 * @returns An instance of the requested service
	 *
	 * @throws {DependencyResolutionError} If no service is registered with the given token
	 * @throws {CircularDependencyError} If circular dependencies are detected during resolution
	 *
	 * @example
	 * ```typescript
	 * const indexManager = container.resolve<IndexManager>('IndexManager');
	 * ```
	 */
	resolve<T>(token: ServiceToken): T {
		const registration = this.registrations.get(token);

		if (!registration) {
			throw new Error(
				`Dependency not found: ${this.formatToken(token)}. ` +
					'Ensure the dependency is registered with the container.'
			);
		}

		// Check for circular dependencies
		if (this.enableCircularDependencyDetection && registration.resolving) {
			const path = this.buildCircularDependencyPath(token);
			throw new Error(`Circular dependency detected: ${path.join(' -> ')}`);
		}

		// Return existing instance for singletons
		if (registration.lifecycle === 'singleton' && registration.instance !== undefined) {
			return registration.instance as T;
		}

		// Mark as resolving to detect circular dependencies
		if (this.enableCircularDependencyDetection) {
			registration.resolving = true;
		}

		try {
			// Create new instance
			const instance = registration.factory();

			// Cache singleton instances
			if (registration.lifecycle === 'singleton') {
				registration.instance = instance;
			}

			return instance as T;
		} finally {
			// Clear resolving flag
			if (this.enableCircularDependencyDetection && registration.resolving !== undefined) {
				registration.resolving = false;
			}
		}
	}

	/**
	 * Check if a service is registered
	 *
	 * @param token - The token to check
	 * @returns true if the service is registered, false otherwise
	 *
	 * @example
	 * ```typescript
	 * if (container.has('IndexManager')) {
	 *   const manager = container.resolve('IndexManager');
	 * }
	 * ```
	 */
	has(token: ServiceToken): boolean {
		return this.registrations.has(token);
	}

	/**
	 * Clear all registered services and cached singleton instances
	 *
	 * This is typically used during application shutdown or testing.
	 *
	 * @example
	 * ```typescript
	 * container.clear(); // Remove all registrations
	 * ```
	 */
	clear(): void {
		// Clear all registrations
		this.registrations.clear();
	}

	/**
	 * Get the number of registered services
	 *
	 * @returns Number of registered services
	 */
	getRegistrationCount(): number {
		return this.registrations.size;
	}

	/**
	 * Get all registered service tokens
	 *
	 * @returns Array of registered service tokens
	 */
	getRegisteredTokens(): ServiceToken[] {
		return Array.from(this.registrations.keys());
	}

	/**
	 * Validate that a service is not already registered
	 *
	 * @param token - Service token to validate
	 *
	 * @throws {DuplicateRegistrationError} If the token is already registered
	 */
	private validateRegistration(token: ServiceToken): void {
		if (this.registrations.has(token)) {
			throw new Error(
				`Service already registered: ${this.formatToken(token)}. ` +
					'Use a unique token or clear the container first.'
			);
		}
	}

	/**
	 * Build the circular dependency path for error messages
	 *
	 * @param token - The token that caused the circular dependency
	 * @returns Array of tokens in the circular dependency path
	 */
	private buildCircularDependencyPath(token: ServiceToken): ServiceToken[] {
		const path: ServiceToken[] = [];

		for (const [key, registration] of this.registrations.entries()) {
			if (registration.resolving) {
				path.push(key);
			}
		}

		path.push(token);
		return path.map((t) => this.formatToken(t));
	}

	/**
	 * Format a token for display in error messages
	 *
	 * @param token - Token to format
	 * @returns Formatted token string
	 */
	private formatToken(token: ServiceToken): string {
		return typeof token === 'symbol' ? token.toString() : token;
	}
}
