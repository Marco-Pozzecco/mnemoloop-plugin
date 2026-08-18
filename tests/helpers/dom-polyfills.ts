/**
 * DOM polyfills required by bits-ui / floating-ui / @dnd-kit when running in a
 * jsdom environment. Applied as a side effect on import, so import this module
 * FIRST in any DOM-based test file.
 */

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.ResizeObserver === 'undefined') {
	class ResizeObserverStub {
		observe(): void {}
		unobserve(): void {}
		disconnect(): void {}
	}
	g.ResizeObserver = ResizeObserverStub;
}

if (typeof g.IntersectionObserver === 'undefined') {
	class IntersectionObserverStub {
		observe(): void {}
		unobserve(): void {}
		disconnect(): void {}
		takeRecords(): unknown[] {
			return [];
		}
	}
	g.IntersectionObserver = IntersectionObserverStub;
}

if (typeof g.matchMedia === 'undefined') {
	g.matchMedia = () => ({
		matches: false,
		media: '',
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	});
}

if (typeof g.requestAnimationFrame === 'undefined') {
	g.requestAnimationFrame = (cb: FrameRequestCallback) =>
		setTimeout(() => cb(Date.now()), 0) as unknown as number;
	g.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

if (typeof g.PointerEvent === 'undefined') {
	// jsdom has no PointerEvent; MouseEvent is close enough for pointer handlers.
	g.PointerEvent = globalThis.MouseEvent;
}
