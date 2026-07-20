import { TooltipProviderPropsWithoutHTML } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface TooltipProviderProps extends TooltipProviderPropsWithoutHTML {
	children?: Snippet;
}
