import type { Snippet } from 'svelte';

export default interface TabsContentProps {
	value: string;
	className?: string;
	children?: Snippet;
}
