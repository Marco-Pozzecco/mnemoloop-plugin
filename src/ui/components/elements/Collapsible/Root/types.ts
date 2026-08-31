import type { Collapsible } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface CollapsibleRootProps
	extends Omit<Collapsible.RootProps, 'child' | 'children' | 'ref'> {
	ref?: HTMLDivElement | null;
	children?: Snippet;
}
