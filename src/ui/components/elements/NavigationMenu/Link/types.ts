import type { Snippet } from 'svelte';

export default interface NavigationMenuLinkProps {
	active?: boolean;
	onSelect?: (e: Event) => void;
	className?: string;
	children?: Snippet;
}
