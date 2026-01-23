/**
 * Schema for validating dependency container registrations
 *
 * Zod schema for validating service tokens, lifecycle options,
 * and registration configurations.
 *
 * @see AGENTS.md: Zod Schema Conventions
 */

import { z } from 'zod';

/**
 * Schema for service lifecycle option
 */
export const ServiceLifecycleSchema = z.enum(['singleton', 'transient'], {
	message: 'Lifecycle must be either "singleton" or "transient"',
});

/**
 * Schema for service token (string or symbol)
 */
export const ServiceTokenSchema = z.union([z.string(), z.symbol()], {
	message: 'Service token must be a string or symbol',
});

/**
 * Schema for service registration options
 */
export const ServiceRegistrationOptionsSchema = z.object({
	lifecycle: ServiceLifecycleSchema,
	description: z.string().optional(),
});

/**
 * Schema for service registration record (internal use)
 */
export const ServiceRegistrationSchema = z.object({
	factory: z.function(),
	lifecycle: ServiceLifecycleSchema,
	description: z.string().optional(),
	instance: z.unknown().optional(),
	resolving: z.boolean().optional(),
});

/**
 * Schema for container initialization options
 */
export const ContainerOptionsSchema = z.object({
	enableCircularDependencyDetection: z.boolean().optional(),
	enableAutoRegistration: z.boolean().optional(),
});

/**
 * Inferred types
 */

/**
 * Service lifecycle type
 */
export type ServiceLifecycle = z.infer<typeof ServiceLifecycleSchema>;

/**
 * Service token type
 */
export type ServiceToken = z.infer<typeof ServiceTokenSchema>;

/**
 * Service registration options type
 */
export type ServiceRegistrationOptions = z.infer<typeof ServiceRegistrationOptionsSchema>;

/**
 * Container options type
 */
export type ContainerOptions = z.infer<typeof ContainerOptionsSchema>;
