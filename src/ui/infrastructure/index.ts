/**
 * Infrastructure Module Index
 *
 * Exports all infrastructure components and utilities.
 */

// Core infrastructure
export { Logger } from '@/utils/Logger';
export type { Logger as LoggerType } from '@/utils/Logger';

export { EventBus, AppEvents } from './EventBus';
export type { AppEventName, EventHandler, UnsubscribeFunction } from './EventBus';

export {
	DependencyContainer,
	CircularDependencyError,
	DependencyResolutionError,
	DuplicateRegistrationError,
	ServiceTokens,
} from './DependencyContainer';

export {
	setManagersContext,
	getManagersContext,
	hasManagersContext,
	resolveDependency,
	resolveService,
} from './ManagersContext';

// Schema exports
export {
	ServiceLifecycleSchema,
	ServiceTokenSchema,
	ServiceRegistrationOptionsSchema,
	ServiceRegistrationSchema,
	ContainerOptionsSchema,
} from './schema/DependencyContainerSchema';
export type {
	ServiceLifecycle,
	ServiceRegistrationOptions,
	ContainerOptions,
} from './schema/DependencyContainerSchema';

// Contracts (includes all types)
export * from './contracts/dependency-container.interface';
