import type { Snippet } from 'svelte';

export default interface NavigationMenuContentProps {
	forceMount?: boolean;
	className?: string;
	children?: Snippet;
}
