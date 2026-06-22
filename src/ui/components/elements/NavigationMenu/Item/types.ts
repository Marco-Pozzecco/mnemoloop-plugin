import type { Snippet } from 'svelte';

export default interface NavigationMenuItemProps {
	value?: string;
	openOnHover?: boolean;
	className?: string;
	children?: Snippet;
}
