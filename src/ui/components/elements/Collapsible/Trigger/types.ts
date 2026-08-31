import type { Collapsible } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface CollapsibleTriggerProps
	extends Omit<Collapsible.TriggerProps, 'child' | 'children' | 'ref'> {
	ref?: HTMLButtonElement | null;
	class?: string;
	children?: Snippet;
}
