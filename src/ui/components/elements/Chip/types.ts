import type { Snippet } from 'svelte';

export default interface ComboboxChipProps {
	class?: string;
	children?: Snippet;
	onDelete?: (event: MouseEvent) => void;
	/** Accessible name for the icon-only remove button. */
	removeLabel?: string;
	icon?: string;
}
