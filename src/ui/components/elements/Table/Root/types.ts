import type { Snippet } from 'svelte';

export default interface TableRootProps {
	/** Accessible caption announced before table contents. */
	caption?: string;
	className?: string;
	children?: Snippet;
}
