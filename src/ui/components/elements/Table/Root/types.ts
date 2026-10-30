import type { Snippet } from 'svelte';

export default interface TableRootProps {
	/** Accessible caption announced before table contents. */
	caption?: string;
	/** Draw the container border, radius, and overflow clip. */
	bordered?: boolean;
	className?: string;
	children?: Snippet;
}
