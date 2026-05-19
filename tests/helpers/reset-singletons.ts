import { EventBus } from '@/modules/events/core/EventBus';
import { EventRegistry } from '@/modules/events/core/EventRegistry';

/**
 * Reset singleton instances between tests.
 * Call this in beforeEach() for any test that uses EventBus or EventRegistry.
 */
export function resetSingletons(): void {
	(EventBus as unknown as { _instance: EventBus | undefined })._instance = undefined;
	(EventRegistry as unknown as { _instance: EventRegistry | undefined })._instance = undefined;
}
