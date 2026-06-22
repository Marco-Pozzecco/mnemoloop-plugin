import type { Snippet } from 'svelte';

export default interface NavigationMenuViewportProps {
	forceMount?: boolean;
	className?: string;
	children?: Snippet;
}
