/**
 * The playground URL contract:
 *   ?view=dashboard|review|manage|analytics|priming|sidebar
 *   ?fixture=<name>            (see fixtures/index.ts)
 *   ?theme=light|dark
 *   ?platform=desktop|mobile
 *
 * Unknown values fall back to a default and log a warning. View and fixture
 * changes reload the page (stores are module singletons); theme and platform
 * apply in place.
 */

export const PLAYGROUND_VIEWS = [
	'dashboard',
	'review',
	'manage',
	'analytics',
	'priming',
	'sidebar',
] as const;
export type PlaygroundView = (typeof PLAYGROUND_VIEWS)[number];

export const PLAYGROUND_THEMES = ['light', 'dark'] as const;
export type PlaygroundTheme = (typeof PLAYGROUND_THEMES)[number];

export const PLAYGROUND_PLATFORMS = ['desktop', 'mobile'] as const;
export type PlaygroundPlatform = (typeof PLAYGROUND_PLATFORMS)[number];

export const DEFAULT_VIEW: PlaygroundView = 'dashboard';
export const DEFAULT_THEME: PlaygroundTheme = 'light';
export const DEFAULT_PLATFORM: PlaygroundPlatform = 'desktop';

export interface PlaygroundParams {
	view: PlaygroundView;
	fixture: string | null;
	theme: PlaygroundTheme;
	platform: PlaygroundPlatform;
}

function pick<T extends string>(
	value: string | null,
	allowed: readonly T[],
	fallback: T,
	label: string,
): T {
	if (value === null) return fallback;
	if ((allowed as readonly string[]).includes(value)) return value as T;
	console.warn(`[playground] Unknown ${label} "${value}"; using "${fallback}".`);
	return fallback;
}

export function readParams(search: string): PlaygroundParams {
	const params = new URLSearchParams(search);
	return {
		view: pick(params.get('view'), PLAYGROUND_VIEWS, DEFAULT_VIEW, 'view'),
		fixture: params.get('fixture'),
		theme: pick(params.get('theme'), PLAYGROUND_THEMES, DEFAULT_THEME, 'theme'),
		platform: pick(params.get('platform'), PLAYGROUND_PLATFORMS, DEFAULT_PLATFORM, 'platform'),
	};
}

export function updateParams(
	changes: Record<string, string | null>,
	options: { reload?: boolean } = {},
): void {
	const url = new URL(window.location.href);
	for (const [key, value] of Object.entries(changes)) {
		if (value === null) url.searchParams.delete(key);
		else url.searchParams.set(key, value);
	}
	if (options.reload) {
		window.location.assign(url);
		return;
	}
	window.history.replaceState({}, '', url);
}

export function applyTheme(theme: PlaygroundTheme): void {
	document.body.classList.toggle('theme-dark', theme === 'dark');
	document.body.classList.toggle('theme-light', theme !== 'dark');
}
