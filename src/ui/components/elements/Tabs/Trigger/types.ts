import type { Snippet } from 'svelte';

export default interface TabsTriggerProps {
	value: string;
	disabled?: boolean;
	className?: string;
	children?: Snippet;
}
