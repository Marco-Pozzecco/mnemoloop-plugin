import type { Snippet } from 'svelte';

export default interface ComboboxChipProps {
	class?: string;
	children?: Snippet;
	onDelete?: (event: MouseEvent) => void;
	icon?: string;
}
