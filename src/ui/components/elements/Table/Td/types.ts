import type { Snippet } from 'svelte';

export default interface TableTdProps {
	colspan?: number;
	rowspan?: number;
	class?: string;
	children?: Snippet;
}
