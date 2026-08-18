import type { Snippet } from 'svelte';

export default interface TableThProps {
	scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
	className?: string;
	children?: Snippet;
}
