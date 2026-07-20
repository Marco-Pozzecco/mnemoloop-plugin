import type { Snippet } from 'svelte';
import type { TooltipTriggerProps as BitsTooltipTriggerProps } from 'bits-ui';

export default interface TooltipTriggerProps extends Omit<BitsTooltipTriggerProps, 'children'> {
	class?: string;
	children?: Snippet;
}
