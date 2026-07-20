import type { Snippet } from 'svelte';

export default interface TooltipRootProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
	disabled?: boolean;
	delayDuration?: number;
	disableHoverableContent?: boolean;
	disableCloseOnTriggerClick?: boolean;
	ignoreNonKeyboardFocus?: boolean;
	children?: Snippet;
}
