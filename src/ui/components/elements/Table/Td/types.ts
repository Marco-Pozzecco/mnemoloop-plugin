import type { Snippet } from 'svelte';

export default interface TableTdProps {
	colspan?: number;
	rowspan?: number;
	className?: string;
	children?: Snippet;
}
