/**
 * ManagersContext for dependency access via Svelte context
 *
 * Provides Svelte context-based access to the dependency container,
 * eliminating prop drilling across component hierarchies.
 *
 * @see FR-005: System MUST provide context-based dependency system
 * @see research.md section 7: Context-Based Dependency System
 */

import { getContext, setContext } from 'svelte';
import type { DependencyContainer } from './DependencyContainer';

/**
 * Unique key for the managers context
 */
const MANAGERS_CONTEXT_KEY = Symbol('managers-context');

/**
 * Set the managers context in the Svelte component tree
 *
 * This should be called in the top-level application component (e.g., App.svelte)
 * to make the dependency container available to all child components.
 *
 * @param container - The dependency container instance to provide
 *
 * @throws {Error} If called outside of a Svelte component initialization
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { setManagersContext } from '@/ui/infrastructure/ManagersContext';
 *   import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
 *
 *   const container = new DependencyContainer();
 *   container.registerSingleton('IndexManager', () => new IndexManager());
 *
 *   setManagersContext(container);
 * </script>
 * ```
 */
export function setManagersContext(container: DependencyContainer): void {
	setContext(MANAGERS_CONTEXT_KEY, container);
}

/**
 * Get the managers context from the Svelte component tree
 *
 * This can be called in any component within the tree to access the
 * dependency container and resolve services.
 *
 * @returns The dependency container instance
 *
 * @throws {Error} If called outside of a context provider or context not set
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { getManagersContext } from '@/ui/infrastructure/ManagersContext';
 *
 *   const container = getManagersContext();
 *   const indexManager = container.resolve<IndexManager>('IndexManager');
 * </script>
 * ```
 */
export function getManagersContext(): DependencyContainer {
	const container = getContext<DependencyContainer | undefined>(MANAGERS_CONTEXT_KEY);

	if (!container) {
		throw new Error(
			'ManagersContext not found. ' +
				'Did you forget to call setManagersContext in a parent component?'
		);
	}

	return container;
}

/**
 * Check if the managers context is available
 *
 * This can be used to conditionally resolve dependencies or provide
 * fallback behavior when running outside of the context tree.
 *
 * @returns true if the context is available, false otherwise
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { hasManagersContext, getManagersContext } from '@/ui/infrastructure/ManagersContext';
 *
 *   if (hasManagersContext()) {
 *     const container = getManagersContext();
 *     // Use container
 *   } else {
 *     // Provide fallback behavior
 *   }
 * </script>
 * ```
 */
export function hasManagersContext(): boolean {
	try {
		const container = getContext<DependencyContainer | undefined>(MANAGERS_CONTEXT_KEY);
		return container !== undefined;
	} catch {
		return false;
	}
}

/**
 * Resolve a dependency from the managers context
 *
 * Convenience function that combines getting the context and resolving
 * a dependency in one call.
 *
 * @param token - The service token to resolve
 * @returns The resolved service instance
 *
 * @throws {Error} If context not available or dependency not found
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { resolveDependency } from '@/ui/infrastructure/ManagersContext';
 *
 *   const indexManager = resolveDependency<IndexManager>('IndexManager');
 * </script>
 * ```
 */
export function resolveDependency<T>(token: string): T {
	const container = getManagersContext();
	return container.resolve<T>(token);
}

/**
 * Type-safe resolver for standard service tokens
 *
 * @param token - Service token from ServiceTokens constant
 * @returns The resolved service instance
 */
export function resolveService<T>(token: string): T {
  return resolveDependency<T>(token);
}

/**
 * Convenience hook to resolve a manager dependency
 *
 * This hook is primarily intended for use in Svelte components to access
 * managers (e.g., IndexManager, StatisticsManager) via the context.
 *
 * @param token - The manager token to resolve
 * @returns The resolved manager instance
 *
 * @throws {Error} If context not available or dependency not found
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useManager } from '@/ui/infrastructure/ManagersContext';
 *
 *   const indexManager = useManager<IndexManager>('IndexManager');
 *   const statisticsManager = useManager<StatisticsManager>('StatisticsManager');
 * </script>
 * ```
 */
export function useManager<T>(token: string): T {
  return resolveDependency<T>(token);
}

/**
 * Convenience hook to resolve a service dependency
 *
 * This hook is primarily intended for use in Svelte components to access
 * services (e.g., EventBus, Logger) via the context.
 *
 * @param token - The service token to resolve
 * @returns The resolved service instance
 *
 * @throws {Error} If context not available or dependency not found
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useService } from '@/ui/infrastructure/ManagersContext';
 *
 *   const eventBus = useService<EventBus>('EventBus');
 *   const logger = useService<Logger>('Logger');
 * </script>
 * ```
 */
export function useService<T>(token: string): T {
  return resolveDependency<T>(token);
}

/**
 * Optional hook to safely resolve a dependency if context is available
 *
 * Returns undefined if the context is not set, allowing components
 * to gracefully handle running outside the context tree (e.g., in tests).
 *
 * @param token - The service token to resolve
 * @returns The resolved service instance or undefined
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { tryResolve } from '@/ui/infrastructure/ManagersContext';
 *
 *   const indexManager = tryResolve<IndexManager>('IndexManager');
 *
 *   if (indexManager) {
 *     // Use the manager
 *     const cards = indexManager.getAllCards();
 *   }
 * </script>
 * ```
 */
export function tryResolve<T>(token: string): T | undefined {
  try {
    return resolveDependency<T>(token);
  } catch {
    return undefined;
  }
}
