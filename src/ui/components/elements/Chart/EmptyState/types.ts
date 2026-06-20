import type { Snippet } from 'svelte';

export default interface ChartEmptyStateProps {
	show: boolean;
	message: string;
	className?: string;
	children: Snippet;
}
