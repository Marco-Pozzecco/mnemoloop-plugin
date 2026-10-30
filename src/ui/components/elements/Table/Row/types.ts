import type { Snippet } from 'svelte';

export default interface TableRowProps {
	/** Persistent highlight for the row whose detail panel is open. */
	selected?: boolean;
	className?: string;
	children?: Snippet;
}
