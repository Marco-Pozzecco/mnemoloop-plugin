import type { Snippet } from 'svelte';

/** Semantic tone of a badge. Each maps to an Obsidian ink and tint pair. */
export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'ghost';

export default interface BadgeProps {
	/** Semantic tone. Carries meaning and paint together. */
	variant?: BadgeVariant;
	/** Corner radius: `sm` is 4px (labels, type), `md` is 8px (status). */
	radius?: 'sm' | 'md';
	/** Render a status dot in the current tone ink. */
	dot?: boolean;
	class?: string;
	children?: Snippet;
}
