import type { Snippet } from 'svelte';

export default interface TableEmptyStateProps {
	title: string;
	message?: string;
	className?: string;
	action?: Snippet;
}
