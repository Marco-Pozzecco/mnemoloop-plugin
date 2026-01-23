/**
 * Dependency Container Setup
 *
 * Configures and registers all services and controllers in the DI container.
 * Follows the dependency injection pattern for testability and loose coupling.
 *
 * @see FR-004: System MUST provide a dependency injection container
 * @see US-004: Dependency Injection for Testability
 */

import type { App } from 'obsidian';
import { EventBus, Logger } from '@/ui/infrastructure/index';
import { DashboardController } from '@/ui/controllers/DashboardController';
import { IndexManager } from '@/core/indexer';
import { StatisticsManager } from '@/core/statistics';
import { SessionStore } from '@/ui/stores/SessionStore';
import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
import type { DependencyContainerContract } from '@/ui/infrastructure/contracts/dependency-container.interface';

/**
 * Configure and register all services in the dependency container
 *
 * This function:
 * 1. Creates a new dependency container instance
 * 2. Registers singleton services (managers, event bus, logger)
 * 3. Registers transient services (controllers, stores)
 * 4. Returns the configured container
 *
 * @param app - Obsidian App instance
 * @returns Configured dependency container
 *
 * @example
 * ```typescript
 * import { setupContainer } from '@/ui/views/App/DependencyContainerSetup';
 *
 * const container = setupContainer(app);
 * const dashboardController = container.resolve<DashboardController>('DashboardController');
 * ```
 */
export function setupContainer(app: App): DependencyContainerContract {
	const container = new DependencyContainer();

	// Register singleton instances first
	registerSingletons(container, app);

	// Register transient services (controllers, stores)
	registerTransients(container);

	return container;
}

/**
 * Register all singleton services
 *
 * Singletons are services that should have a single instance throughout
 * the application lifetime (managers, infrastructure services).
 *
 * @param container - Dependency container to register services in
 * @param app - Obsidian App instance
 */
function registerSingletons(container: DependencyContainer, app: App): void {
	// Register infrastructure services
	container.registerSingleton('Logger', () => new Logger('App'), 'Application root logger');
	container.registerSingleton('EventBus', () => new EventBus(), 'Event bus for cross-component communication');

	// Register core managers
	container.registerSingleton('IndexManager', () => new IndexManager(app), 'Flashcard index manager');
	container.registerSingleton('StatisticsManager', () => new StatisticsManager(app), 'Statistics manager');

	// Note: DueQueueManager, SessionManager, SettingsManager require additional dependencies
	// They will be properly registered when those dependencies are available
	// container.registerSingleton('DueQueueManager', () => new DueQueueManager(app, settings), 'Due queue manager');
}

/**
 * Register all transient services
 *
 * Transients are services that get a new instance each time they are resolved.
 * This is appropriate for controllers and stores that maintain per-instance state.
 *
 * @param container - Dependency container to register services in
 */
function registerTransients(container: DependencyContainer): void {
	// Register controllers
	container.register(
		'DashboardController',
		() =>
			new DashboardController(
				container.resolve('Logger'),
				container.resolve('EventBus'),
				container.resolve('IndexManager'),
				container.resolve('StatisticsManager')
			),
		{
			lifecycle: 'transient',
			description: 'Dashboard controller',
		}
	);

	// Note: ReviewController and SettingsController will be registered when created
	// container.register('ReviewController', () => new ReviewController(...));
	// container.register('SettingsController', () => new SettingsController(...));

	// Note: SessionStore, SettingsStore, UIStore require additional dependencies
	// They will be properly registered when those dependencies are available
	// container.register('SessionStore', () => new SessionStore(...), { lifecycle: 'transient' });
	// container.register('SettingsStore', () => new SettingsStore({...}), { lifecycle: 'transient' });
	// container.register('UIStore', () => new UIStore({...}), { lifecycle: 'transient' });
}
