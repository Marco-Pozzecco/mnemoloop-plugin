import type { Collapsible } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface CollapsibleContentProps
	extends Omit<
		Collapsible.ContentProps,
		'child' | 'children' | 'forceMount' | 'hiddenUntilFound' | 'ref'
	> {
	ref?: HTMLDivElement | null;
	forceMount?: boolean;
	hiddenUntilFound?: boolean;
	class?: string;
	children?: Snippet;
}
