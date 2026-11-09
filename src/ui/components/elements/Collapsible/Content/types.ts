import type { Collapsible } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface CollapsibleContentProps extends Omit<
	Collapsible.ContentProps,
	'child' | 'children' | 'forceMount' | 'hiddenUntilFound' | 'ref'
> {
	ref?: HTMLDivElement | null;
	forceMount?: boolean;
	hiddenUntilFound?: boolean;
	class?: string;
	/** Inner padding: the default disclosure rhythm, or flush for edge-to-edge content. */
	padding?: 'default' | 'none';
	/** Draw the hairline between the trigger and the content. */
	divided?: boolean;
	children?: Snippet;
}
