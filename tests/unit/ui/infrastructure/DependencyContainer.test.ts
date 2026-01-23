/**
 * Unit tests for DependencyContainer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';

describe('DependencyContainer', () => {
	let container: DependencyContainer;

	beforeEach(() => {
		container = new DependencyContainer();
	});

	describe('construction', () => {
		it('should create a new container', () => {
			expect(container).toBeDefined();
		});

		it('should create container with circular dependency detection enabled by default', () => {
			const newContainer = new DependencyContainer();
			expect(newContainer).toBeDefined();
		});

		it('should create container with circular dependency detection disabled', () => {
			const newContainer = new DependencyContainer({ enableCircularDependencyDetection: false });
			expect(newContainer).toBeDefined();
		});
	});

	describe('register', () => {
		it('should register a transient service', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			container.register('test-service', factory);

			expect(container.has('test-service')).toBe(true);
		});

		it('should register a service with description', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			container.register('test-service', factory, {
				description: 'A test service',
			});

			expect(container.has('test-service')).toBe(true);
		});

		it('should create a new instance on each resolve for transient services', () => {
			const factory = vi.fn(() => ({ value: Math.random() }));
			container.register('test-service', factory);

			const instance1 = container.resolve('test-service');
			const instance2 = container.resolve('test-service');

			expect(factory).toHaveBeenCalledTimes(2);
			expect(instance1).not.toBe(instance2);
		});

		it('should throw error when registering duplicate service', () => {
			const factory = vi.fn(() => ({ value: 42 }));

			container.register('test-service', factory);

			expect(() => {
				container.register('test-service', factory);
			}).toThrow('Service already registered: test-service');
		});

		it('should register with string token', () => {
			const factory = vi.fn(() => ({}));
			container.register('string-token', factory);

			expect(container.has('string-token')).toBe(true);
		});

		it('should register with symbol token', () => {
			const factory = vi.fn(() => ({}));
			const symbolToken = Symbol('test');

			container.register(symbolToken, factory);

			expect(container.has(symbolToken)).toBe(true);
		});
	});

	describe('registerSingleton', () => {
		it('should register a singleton service', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			container.registerSingleton('singleton-service', factory);

			expect(container.has('singleton-service')).toBe(true);
		});

		it('should register singleton with description', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			container.registerSingleton('singleton-service', factory, 'A singleton test service');

			expect(container.has('singleton-service')).toBe(true);
		});

		it('should return same instance on each resolve for singleton services', () => {
			const factory = vi.fn(() => ({ value: Math.random() }));
			container.registerSingleton('singleton-service', factory);

			const instance1 = container.resolve('singleton-service');
			const instance2 = container.resolve('singleton-service');

			expect(factory).toHaveBeenCalledTimes(1); // Called only once
			expect(instance1).toBe(instance2);
		});

		it('should throw error when registering duplicate singleton', () => {
			const factory = vi.fn(() => ({ value: 42 }));

			container.registerSingleton('singleton-service', factory);

			expect(() => {
				container.registerSingleton('singleton-service', factory);
			}).toThrow('Service already registered: singleton-service');
		});
	});

	describe('resolve', () => {
		it('should resolve a registered service', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			container.register('test-service', factory);

			const instance = container.resolve('test-service');

			expect(instance).toEqual({ value: 42 });
			expect(factory).toHaveBeenCalledTimes(1);
		});

		it('should throw error when resolving unregistered service', () => {
			expect(() => {
				container.resolve('non-existent-service');
			}).toThrow('Dependency not found: non-existent-service');
		});

		it('should resolve service with symbol token', () => {
			const factory = vi.fn(() => ({ value: 42 }));
			const symbolToken = Symbol('test');

			container.register(symbolToken, factory);

			const instance = container.resolve(symbolToken);

			expect(instance).toEqual({ value: 42 });
		});

		it('should support type-safe resolution', () => {
			interface TestService {
				getValue(): number;
			}

			const factory = vi.fn((): TestService => ({
				getValue: () => 42,
			}));

			container.register<TestService>('test-service', factory);

			const service = container.resolve<TestService>('test-service');

			expect(service.getValue()).toBe(42);
		});

		it('should resolve dependencies within factory', () => {
			interface ServiceA {
				name: string;
			}

			interface ServiceB {
				a: ServiceA;
			}

			container.register<ServiceA>('ServiceA', () => ({ name: 'Service A' }));
			container.register<ServiceB>('ServiceB', () => ({
				a: container.resolve<ServiceA>('ServiceA'),
			}));

			const serviceB = container.resolve<ServiceB>('ServiceB');

			expect(serviceB.a.name).toBe('Service A');
		});
	});

	describe('circular dependency detection', () => {
		it('should detect circular dependencies', () => {
			interface ServiceA {
				b: ServiceB;
			}

			interface ServiceB {
				a: ServiceA;
			}

			container.register<ServiceA>('ServiceA', () => {
				return { b: container.resolve<ServiceB>('ServiceB') };
			});

			container.register<ServiceB>('ServiceB', () => {
				return { a: container.resolve<ServiceA>('ServiceA') };
			});

			expect(() => {
				container.resolve<ServiceA>('ServiceA');
			}).toThrow('Circular dependency detected');
		});

		it('should allow self-referencing singleton (edge case)', () => {
			interface SelfReferencing {
				getSelf: () => SelfReferencing;
			}

			// Register a singleton that will be injected
			const singletonInstance: Partial<SelfReferencing> = {
				getSelf: () => container.resolve<SelfReferencing>('Service'),
			};

			container.register<SelfReferencing>('Service', () => {
				return singletonInstance as SelfReferencing;
			});

			// First call
			const instance1 = container.resolve<SelfReferencing>('Service');
			expect(instance1.getSelf()).toBe(instance1);

			// Second call - should return same instance
			const instance2 = container.resolve<SelfReferencing>('Service');
			expect(instance2).toBe(instance1);
		});

		it('should not detect circular dependency when disabled', () => {
			const containerNoDetection = new DependencyContainer({
				enableCircularDependencyDetection: false,
			});

			containerNoDetection.register('ServiceA', () => {
				return { b: containerNoDetection.resolve('ServiceB') };
			});

			containerNoDetection.register('ServiceB', () => {
				return { a: containerNoDetection.resolve('ServiceA') };
			});

			// This will cause infinite loop in runtime, but shouldn't throw from detection
			// We'll catch the stack overflow
			expect(() => {
				containerNoDetection.resolve('ServiceA');
			}).toThrow();
		});
	});

	describe('has', () => {
		it('should return true for registered services', () => {
			container.register('test-service', () => ({}));
			expect(container.has('test-service')).toBe(true);
		});

		it('should return false for unregistered services', () => {
			expect(container.has('non-existent')).toBe(false);
		});

		it('should work with symbol tokens', () => {
			const symbolToken = Symbol('test');
			container.register(symbolToken, () => ({}));

			expect(container.has(symbolToken)).toBe(true);
		});
	});

	describe('clear', () => {
		it('should remove all registrations', () => {
			container.register('service-1', () => ({}));
			container.register('service-2', () => ({}));
			container.registerSingleton('singleton-1', () => ({}));

			expect(container.getRegistrationCount()).toBe(3);

			container.clear();

			expect(container.getRegistrationCount()).toBe(0);
			expect(container.has('service-1')).toBe(false);
			expect(container.has('service-2')).toBe(false);
			expect(container.has('singleton-1')).toBe(false);
		});

		it('should allow re-registering after clear', () => {
			container.register('test-service', () => ({}));
			container.clear();

			expect(() => {
				container.register('test-service', () => ({}));
			}).not.toThrow();

			expect(container.has('test-service')).toBe(true);
		});
	});

	describe('getRegistrationCount', () => {
		it('should return 0 for empty container', () => {
			expect(container.getRegistrationCount()).toBe(0);
		});

		it('should return the correct count after registrations', () => {
			container.register('service-1', () => ({}));
			container.register('service-2', () => ({}));
			container.registerSingleton('singleton-1', () => ({}));

			expect(container.getRegistrationCount()).toBe(3);
		});
	});

	describe('getRegisteredTokens', () => {
		it('should return empty array for empty container', () => {
			expect(container.getRegisteredTokens()).toEqual([]);
		});

		it('should return all registered tokens', () => {
			container.register('service-1', () => ({}));
			container.register('service-2', () => ({}));
			const symbolToken = Symbol('test');
			container.register(symbolToken, () => ({}));

			const tokens = container.getRegisteredTokens();

			expect(tokens).toHaveLength(3);
			expect(tokens).toContain('service-1');
			expect(tokens).toContain('service-2');
			expect(tokens).toContain(symbolToken);
		});
	});

	describe('lifecycle', () => {
		it('should support both transient and singleton services', () => {
			const transientFactory = vi.fn(() => ({ value: Math.random() }));
			const singletonFactory = vi.fn(() => ({ value: Math.random() }));

			container.register('transient', transientFactory);
			container.registerSingleton('singleton', singletonFactory);

			// Resolve transient twice
			const t1 = container.resolve('transient');
			const t2 = container.resolve('transient');
			expect(transientFactory).toHaveBeenCalledTimes(2);
			expect(t1).not.toBe(t2);

			// Resolve singleton twice
			const s1 = container.resolve('singleton');
			const s2 = container.resolve('singleton');
			expect(singletonFactory).toHaveBeenCalledTimes(1);
			expect(s1).toBe(s2);
		});
	});

	describe('integration scenarios', () => {
		it('should support a typical controller setup', () => {
			interface Logger {
				log(message: string): void;
			}

			interface IndexManager {
				getIndex(): string[];
			}

			interface DashboardController {
				getData(): string[];
			}

			// Register services
			container.register<Logger>('Logger', () => ({
				log: vi.fn(),
			}));

			container.register<IndexManager>('IndexManager', () => ({
				getIndex: () => ['card1', 'card2', 'card3'],
			}));

			container.register<DashboardController>('DashboardController', () => {
				const logger = container.resolve<Logger>('Logger');
				const indexManager = container.resolve<IndexManager>('IndexManager');

				return {
					getData: () => {
						logger.log('Getting data');
						return indexManager.getIndex();
					},
				};
			});

			const controller = container.resolve<DashboardController>('DashboardController');
			const data = controller.getData();

			expect(data).toEqual(['card1', 'card2', 'card3']);
		});
	});
});
