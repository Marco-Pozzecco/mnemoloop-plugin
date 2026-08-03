import { TooltipArrowPropsWithoutHTML } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface TooltipArrowProps extends TooltipArrowPropsWithoutHTML {
	class?: string;
	children?: Snippet;
}
